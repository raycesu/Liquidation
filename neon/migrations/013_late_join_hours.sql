alter table if exists public.rooms
add column if not exists late_join_hours integer check (late_join_hours is null or late_join_hours >= 0);

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
      and r.settled_at is null
      and now() < r.end_date
      and (
        r.late_join_hours is null
        or now() < r.start_date + (r.late_join_hours * interval '1 hour')
      )
  )
);
