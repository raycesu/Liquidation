alter table public.orders
  add column if not exists parent_order_id uuid references public.orders (id) on delete cascade;

create index if not exists orders_parent_order_id_idx on public.orders (parent_order_id);
