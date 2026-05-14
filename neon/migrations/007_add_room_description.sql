alter table if exists public.rooms
add column if not exists description text;
