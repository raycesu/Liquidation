alter table public.users
  add column if not exists profile_setup_completed_at timestamptz;
