alter table if exists public.orders
drop column if exists reduce_only;

drop function if exists public.liquidate_underwater_positions();
