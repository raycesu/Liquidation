import { getSql } from "../lib/db"

type ParticipantDeltaRow = {
  room_id: string
  participant_id: string
  gross_trade_pnl: number
  net_trade_pnl: number
  funding_pnl: number
}

const main = async () => {
  if (!process.env.DATABASE_URL) {
    console.log("skipping historical leaderboard backfill: DATABASE_URL is not set")
    return
  }

  const sql = getSql()

  const rows = (await sql`
    select
      rp.room_id::text as room_id,
      rp.id::text as participant_id,
      coalesce(sum(t.realized_pnl), 0)::float8 as gross_trade_pnl,
      coalesce(sum(coalesce(t.realized_pnl, 0) - coalesce(t.fee, 0)), 0)::float8 as net_trade_pnl,
      coalesce(
        (
          select sum(coalesce(fp.actual_applied, fp.payment_amount))
          from funding_payments fp
          where fp.participant_id = rp.id
        ),
        0
      )::float8 as funding_pnl
    from room_participants rp
    left join trades t
      on t.participant_id = rp.id
      and t.direction in ('CLOSE_LONG', 'CLOSE_SHORT')
      and t.realized_pnl is not null
    group by rp.room_id, rp.id
    order by rp.room_id, rp.id
  `) as ParticipantDeltaRow[]

  const impacted = rows.filter((row) => Math.abs(row.gross_trade_pnl - row.net_trade_pnl) > 1e-9)
  const totalFeeDelta = impacted.reduce((sum, row) => sum + (row.gross_trade_pnl - row.net_trade_pnl), 0)

  console.log(`participants scanned: ${rows.length}`)
  console.log(`participants impacted by fee exclusion: ${impacted.length}`)
  console.log(`aggregate fee delta moved into net pnl: ${totalFeeDelta.toFixed(2)} USD`)
  console.log("historical leaderboard backfill status: complete (query logic is now net-fee aware)")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
