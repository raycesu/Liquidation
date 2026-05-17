import { getSql } from "@/lib/db"
import { computeFundingPayment, fetchHlFundingRatesByHlName, getFundingHourUtc } from "@/lib/funding"
import { getMarket } from "@/lib/markets"
import type { Position, PositionSide, SupportedSymbol } from "@/lib/types"

type OpenPositionRow = Position & {
  room_id: string
}

export type RunFundingEngineResult = {
  applied: number
  skippedMissingRate: number
  skippedAlreadyFunded: number
}

const toIsoHour = (date: Date) => date.toISOString()

export const runFundingEngineForRoom = async (roomId: string): Promise<RunFundingEngineResult> => {
  const sql = getSql()
  const currentHour = getFundingHourUtc()
  const currentHourIso = toIsoHour(currentHour)

  const openPositions = (await sql`
    select
      p.id::text,
      p.participant_id::text,
      p.symbol,
      p.side,
      p.leverage,
      p.size::float8 as size,
      p.margin_allocated::float8 as margin_allocated,
      p.entry_price::float8 as entry_price,
      p.liquidation_price::float8 as liquidation_price,
      p.is_open,
      p.last_funding_hour::text,
      p.created_at::text,
      p.closed_at::text,
      rp.room_id::text as room_id
    from positions p
    join room_participants rp on rp.id = p.participant_id
    join rooms r on r.id = rp.room_id
    where rp.room_id = ${roomId}
      and r.is_active = true
      and p.is_open = true
      and (
        p.last_funding_hour is null
        or p.last_funding_hour < ${currentHourIso}::timestamptz
      )
  `) as OpenPositionRow[]

  if (openPositions.length === 0) {
    return { applied: 0, skippedMissingRate: 0, skippedAlreadyFunded: 0 }
  }

  const ratesByHlName = await fetchHlFundingRatesByHlName()
  let applied = 0
  let skippedMissingRate = 0

  for (const position of openPositions) {
    const market = getMarket(position.symbol)

    if (!market) {
      skippedMissingRate += 1
      continue
    }

    const hourlyRate = ratesByHlName.get(market.hlName)

    if (hourlyRate == null) {
      skippedMissingRate += 1
      console.warn("[runFundingEngine] missing HL funding rate", {
        symbol: position.symbol,
        hlName: market.hlName,
      })
      continue
    }

    const payment = computeFundingPayment(position.side as PositionSide, position.size, hourlyRate)

    const inserted = (await sql`
      with updated_margin as (
        update room_participants rp
        set available_margin = greatest(0, available_margin + ${payment})
        from positions p
        where rp.id = p.participant_id
          and p.id = ${position.id}
          and p.is_open = true
          and (
            p.last_funding_hour is null
            or p.last_funding_hour < ${currentHourIso}::timestamptz
          )
        returning rp.id::text
      ),
      recorded_payment as (
        insert into funding_payments (
          participant_id,
          position_id,
          symbol,
          funding_rate,
          payment_amount,
          funding_hour
        )
        select
          ${position.participant_id},
          ${position.id},
          ${position.symbol as SupportedSymbol},
          ${hourlyRate},
          ${payment},
          ${currentHourIso}::timestamptz
        where exists (select 1 from updated_margin)
        on conflict (position_id, funding_hour) do nothing
        returning id::text
      ),
      updated_position as (
        update positions
        set last_funding_hour = ${currentHourIso}::timestamptz
        where id = ${position.id}
          and is_open = true
          and exists (select 1 from recorded_payment)
        returning id::text
      )
      select id from recorded_payment
    `) as { id: string }[]

    if (inserted[0]) {
      applied += 1
    }
  }

  return {
    applied,
    skippedMissingRate,
    skippedAlreadyFunded: 0,
  }
}

export const runFundingEngineForActiveRooms = async () => {
  const sql = getSql()
  const activeRooms = (await sql`
    select id::text
    from rooms
    where is_active = true
  `) as { id: string }[]

  let totalApplied = 0
  let totalSkippedMissingRate = 0

  for (const room of activeRooms) {
    const result = await runFundingEngineForRoom(room.id)
    totalApplied += result.applied
    totalSkippedMissingRate += result.skippedMissingRate
  }

  return {
    processedRooms: activeRooms.length,
    totalApplied,
    totalSkippedMissingRate,
  }
}
