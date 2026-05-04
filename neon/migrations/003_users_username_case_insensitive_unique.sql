-- Enforce case-insensitive username uniqueness.

alter table public.users drop constraint if exists users_username_key;
create unique index if not exists users_username_lower_unique_idx on public.users (lower(username));
