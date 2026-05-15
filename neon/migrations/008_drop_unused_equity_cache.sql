-- Equity is computed at read time from margin + open positions + marks.
-- latest_prices was write-only from liquidation and unused by reads.

drop table if exists public.latest_prices;

alter table public.room_participants
  drop column if exists total_equity;
