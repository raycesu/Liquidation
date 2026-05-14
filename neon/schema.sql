create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key,
  email text not null,
  username text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null references public.users(id) on delete cascade,
  name text not null,
  join_code text not null check (join_code ~ '^[A-Z0-9]{6}$'),
  starting_balance numeric not null default 10000 check (starting_balance > 0),
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  available_margin numeric not null check (available_margin >= 0),
  total_equity numeric not null check (total_equity >= 0),
  created_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.room_participants(id) on delete cascade,
  symbol text not null check (char_length(symbol) >= 3 and char_length(symbol) <= 64),
  side text not null check (side in ('LONG', 'SHORT')),
  leverage integer not null check (leverage between 1 and 50),
  size numeric not null check (size > 0),
  margin_allocated numeric not null check (margin_allocated > 0),
  entry_price numeric not null check (entry_price > 0),
  liquidation_price numeric not null check (liquidation_price > 0),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.latest_prices (
  symbol text primary key check (char_length(symbol) >= 3 and char_length(symbol) <= 64),
  price numeric not null check (price > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.room_participants(id) on delete cascade,
  position_id uuid references public.positions(id) on delete cascade,
  symbol text not null check (char_length(symbol) >= 3 and char_length(symbol) <= 64),
  side text not null check (side in ('LONG', 'SHORT')),
  type text not null check (type in ('LIMIT', 'TAKE_PROFIT', 'STOP_LOSS')),
  size numeric not null check (size > 0),
  leverage integer not null check (leverage between 1 and 50),
  trigger_price numeric not null check (trigger_price > 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'FILLED', 'CANCELLED')),
  margin_reserved numeric not null default 0 check (margin_reserved >= 0),
  created_at timestamptz not null default now(),
  filled_at timestamptz,
  cancelled_at timestamptz
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.room_participants(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  symbol text not null check (char_length(symbol) >= 3 and char_length(symbol) <= 64),
  direction text not null check (direction in ('OPEN_LONG', 'OPEN_SHORT', 'CLOSE_LONG', 'CLOSE_SHORT')),
  price numeric not null check (price > 0),
  size numeric not null check (size > 0),
  trade_value numeric not null check (trade_value >= 0),
  realized_pnl numeric,
  created_at timestamptz not null default now()
);

create index if not exists rooms_creator_id_idx on public.rooms (creator_id);
create unique index if not exists rooms_join_code_unique_idx on public.rooms (join_code);
create unique index if not exists users_username_lower_unique_idx on public.users (lower(username));
create index if not exists room_participants_user_id_idx on public.room_participants (user_id);
create index if not exists room_participants_room_id_idx on public.room_participants (room_id);
create index if not exists positions_participant_id_idx on public.positions (participant_id);
create index if not exists positions_open_idx on public.positions (is_open) where is_open = true;
create index if not exists orders_participant_id_idx on public.orders (participant_id);
create index if not exists orders_position_id_idx on public.orders (position_id);
create index if not exists orders_pending_idx on public.orders (status) where status = 'PENDING';
create index if not exists trades_participant_id_idx on public.trades (participant_id);
create index if not exists trades_position_id_idx on public.trades (position_id);
create index if not exists trades_created_at_idx on public.trades (created_at desc);

create or replace function public.current_app_user_id()
returns text
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claim.sub', true),
      current_setting('app.current_user_id', true)
    ),
    ''
  )::text
$$;

alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.positions enable row level security;
alter table public.latest_prices enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self
on public.users
for select
using (id = public.current_app_user_id());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self
on public.users
for insert
with check (id = public.current_app_user_id());

drop policy if exists users_update_self on public.users;
create policy users_update_self
on public.users
for update
using (id = public.current_app_user_id())
with check (id = public.current_app_user_id());

drop policy if exists rooms_select_member_or_creator on public.rooms;
create policy rooms_select_member_or_creator
on public.rooms
for select
using (
  creator_id = public.current_app_user_id()
  or exists (
    select 1
    from public.room_participants rp
    where rp.room_id = rooms.id
      and rp.user_id = public.current_app_user_id()
  )
);

drop policy if exists rooms_insert_creator on public.rooms;
create policy rooms_insert_creator
on public.rooms
for insert
with check (creator_id = public.current_app_user_id());

drop policy if exists rooms_update_creator on public.rooms;
create policy rooms_update_creator
on public.rooms
for update
using (creator_id = public.current_app_user_id())
with check (creator_id = public.current_app_user_id());

drop policy if exists room_participants_select_room_members on public.room_participants;
create policy room_participants_select_room_members
on public.room_participants
for select
using (
  exists (
    select 1
    from public.room_participants rp
    where rp.room_id = room_participants.room_id
      and rp.user_id = public.current_app_user_id()
  )
);

drop policy if exists room_participants_insert_self on public.room_participants;
create policy room_participants_insert_self
on public.room_participants
for insert
with check (
  user_id = public.current_app_user_id()
  and exists (
    select 1
    from public.rooms r
    where r.id = room_participants.room_id
      and r.is_active = true
  )
);

drop policy if exists room_participants_update_self on public.room_participants;
create policy room_participants_update_self
on public.room_participants
for update
using (user_id = public.current_app_user_id())
with check (user_id = public.current_app_user_id());

drop policy if exists positions_select_room_members on public.positions;
create policy positions_select_room_members
on public.positions
for select
using (
  exists (
    select 1
    from public.room_participants rp_owner
    where rp_owner.id = positions.participant_id
      and (
        rp_owner.user_id = public.current_app_user_id()
        or exists (
          select 1
          from public.room_participants rp_viewer
          where rp_viewer.room_id = rp_owner.room_id
            and rp_viewer.user_id = public.current_app_user_id()
        )
      )
  )
);

drop policy if exists positions_insert_owner on public.positions;
create policy positions_insert_owner
on public.positions
for insert
with check (
  exists (
    select 1
    from public.room_participants rp
    where rp.id = positions.participant_id
      and rp.user_id = public.current_app_user_id()
  )
);

drop policy if exists positions_update_owner on public.positions;
create policy positions_update_owner
on public.positions
for update
using (
  exists (
    select 1
    from public.room_participants rp
    where rp.id = positions.participant_id
      and rp.user_id = public.current_app_user_id()
  )
)
with check (
  exists (
    select 1
    from public.room_participants rp
    where rp.id = positions.participant_id
      and rp.user_id = public.current_app_user_id()
  )
);

drop policy if exists latest_prices_select_authenticated on public.latest_prices;
create policy latest_prices_select_authenticated
on public.latest_prices
for select
using (public.current_app_user_id() is not null);

drop policy if exists orders_select_room_members on public.orders;
create policy orders_select_room_members
on public.orders
for select
using (
  exists (
    select 1
    from public.room_participants rp_owner
    where rp_owner.id = orders.participant_id
      and (
        rp_owner.user_id = public.current_app_user_id()
        or exists (
          select 1
          from public.room_participants rp_viewer
          where rp_viewer.room_id = rp_owner.room_id
            and rp_viewer.user_id = public.current_app_user_id()
        )
      )
  )
);

drop policy if exists orders_insert_owner on public.orders;
create policy orders_insert_owner
on public.orders
for insert
with check (
  exists (
    select 1
    from public.room_participants rp
    where rp.id = orders.participant_id
      and rp.user_id = public.current_app_user_id()
  )
);

drop policy if exists orders_update_owner on public.orders;
create policy orders_update_owner
on public.orders
for update
using (
  exists (
    select 1
    from public.room_participants rp
    where rp.id = orders.participant_id
      and rp.user_id = public.current_app_user_id()
  )
)
with check (
  exists (
    select 1
    from public.room_participants rp
    where rp.id = orders.participant_id
      and rp.user_id = public.current_app_user_id()
  )
);

drop policy if exists trades_select_room_members on public.trades;
create policy trades_select_room_members
on public.trades
for select
using (
  exists (
    select 1
    from public.room_participants rp_owner
    where rp_owner.id = trades.participant_id
      and (
        rp_owner.user_id = public.current_app_user_id()
        or exists (
          select 1
          from public.room_participants rp_viewer
          where rp_viewer.room_id = rp_owner.room_id
            and rp_viewer.user_id = public.current_app_user_id()
        )
      )
  )
);

drop policy if exists trades_insert_owner on public.trades;
create policy trades_insert_owner
on public.trades
for insert
with check (
  exists (
    select 1
    from public.room_participants rp
    where rp.id = trades.participant_id
      and rp.user_id = public.current_app_user_id()
  )
);
