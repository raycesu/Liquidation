alter table if exists public.rooms
add column if not exists join_code text;

do $$
declare
  room_record record;
  generated_code text;
begin
  for room_record in
    select id
    from public.rooms
    where join_code is null
  loop
    loop
      select string_agg(
        substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random() * 36)::int + 1, 1),
        ''
      )
      into generated_code
      from generate_series(1, 6);

      exit when not exists (
        select 1
        from public.rooms
        where join_code = generated_code
      );
    end loop;

    update public.rooms
    set join_code = generated_code
    where id = room_record.id;
  end loop;
end $$;

alter table if exists public.rooms
alter column join_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rooms_join_code_format_check'
  ) then
    alter table public.rooms
    add constraint rooms_join_code_format_check
    check (join_code ~ '^[A-Z0-9]{6}$');
  end if;
end $$;

create unique index if not exists rooms_join_code_unique_idx
on public.rooms (join_code);
