alter table public.trades
  add column if not exists fee numeric not null default 0 check (fee >= 0),
  add column if not exists liquidity_role text check (liquidity_role in ('MAKER', 'TAKER'));

alter table public.positions
  add column if not exists last_funding_hour timestamptz;

create table if not exists public.funding_payments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.room_participants(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  symbol text not null check (char_length(symbol) >= 3 and char_length(symbol) <= 64),
  funding_rate numeric not null,
  payment_amount numeric not null,
  funding_hour timestamptz not null,
  created_at timestamptz not null default now(),
  unique (position_id, funding_hour)
);

create index if not exists funding_payments_participant_id_idx on public.funding_payments (participant_id);
create index if not exists funding_payments_position_id_idx on public.funding_payments (position_id);
create index if not exists positions_last_funding_hour_idx on public.positions (last_funding_hour) where is_open = true;

alter table public.funding_payments enable row level security;

drop policy if exists funding_payments_select_room_members on public.funding_payments;
create policy funding_payments_select_room_members
on public.funding_payments
for select
using (
  exists (
    select 1
    from public.room_participants rp_owner
    where rp_owner.id = funding_payments.participant_id
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
