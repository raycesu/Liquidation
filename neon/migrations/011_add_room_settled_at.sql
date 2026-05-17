alter table public.rooms
  add column if not exists settled_at timestamptz;

create index if not exists rooms_unsettled_due_idx
  on public.rooms (end_date)
  where settled_at is null;
