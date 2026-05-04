-- Relax symbol enumeration and widen max leverage for Hyperliquid-aligned markets.

alter table public.positions drop constraint if exists positions_symbol_check;
alter table public.positions drop constraint if exists positions_leverage_check;
alter table public.positions add constraint positions_symbol_check check (char_length(symbol) >= 3 and char_length(symbol) <= 64);
alter table public.positions add constraint positions_leverage_check check (leverage between 1 and 50);

alter table public.latest_prices drop constraint if exists latest_prices_symbol_check;
alter table public.latest_prices add constraint latest_prices_symbol_check check (char_length(symbol) >= 3 and char_length(symbol) <= 64);

alter table public.orders drop constraint if exists orders_symbol_check;
alter table public.orders drop constraint if exists orders_leverage_check;
alter table public.orders add constraint orders_symbol_check check (char_length(symbol) >= 3 and char_length(symbol) <= 64);
alter table public.orders add constraint orders_leverage_check check (leverage between 1 and 50);

alter table public.trades drop constraint if exists trades_symbol_check;
alter table public.trades add constraint trades_symbol_check check (char_length(symbol) >= 3 and char_length(symbol) <= 64);
