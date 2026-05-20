alter table if exists public.rooms
add column if not exists is_public boolean not null default false;

alter table if exists public.rooms
alter column join_code drop not null;

alter table if exists public.rooms
drop constraint if exists rooms_join_code_format_check;

alter table if exists public.rooms
drop constraint if exists rooms_join_code_check;

alter table if exists public.rooms
add constraint rooms_visibility_join_code_check
check (
  (is_public = true and join_code is null)
  or (is_public = false and join_code ~ '^[A-Z0-9]{6}$')
);

drop index if exists public.rooms_join_code_unique_idx;

create unique index if not exists rooms_join_code_unique_idx
on public.rooms (join_code)
where join_code is not null;

drop policy if exists rooms_select_member_or_creator on public.rooms;

create policy rooms_select_member_or_creator_or_public
on public.rooms
for select
using (
  creator_id = public.current_app_user_id()
  or is_public = true
  or exists (
    select 1
    from public.room_participants rp
    where rp.room_id = rooms.id
      and rp.user_id = public.current_app_user_id()
  )
);

drop policy if exists room_participants_delete_creator on public.room_participants;

create policy room_participants_delete_creator
on public.room_participants
for delete
using (
  exists (
    select 1
    from public.rooms r
    where r.id = room_participants.room_id
      and r.creator_id = public.current_app_user_id()
  )
  and room_participants.user_id <> public.current_app_user_id()
);
