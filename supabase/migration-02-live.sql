-- Run once in the Supabase SQL editor, after schema.sql. Safe to run again.

-- 1. Simpler shapes that match the app
alter table seasons add column if not exists areas text[] not null default array['Zone A','Zone B','Zone C','Zone D'];
alter table households add column if not exists area text not null default '';
alter table households add column if not exists free jsonb not null default '{}'::jsonb;
alter table households add column if not exists song_ids text[] not null default '{}';
alter table households add column if not exists custom_songs text[] not null default '{}';
alter table households alter column edit_code drop not null;

insert into seasons (year, advent_start, christmas)
values (2026, '2026-11-29', '2026-12-25')
on conflict (year) do nothing;

-- 2. Songs the team adds (the built-in list ships with the app)
drop policy if exists admin_write_songs on songs;
create policy admin_write_songs on songs for all using (is_admin()) with check (is_admin());

-- 3. Season settings: everyone can read the areas, only admins change them
alter table seasons enable row level security;
drop policy if exists seasons_read on seasons;
drop policy if exists seasons_admin_write on seasons;
create policy seasons_read on seasons for select using (true);
create policy seasons_admin_write on seasons for all using (is_admin()) with check (is_admin());

-- 4. Families enrol and look up their visit without being able to read anyone else's data
create or replace function enrol_household(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_code text := lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
  v_id uuid;
  v_season int := (select max(year) from seasons);
  v_phone text := right(regexp_replace(coalesce(p->>'phone',''), '[^0-9]', '', 'g'), 10);
begin
  if length(trim(coalesce(p->>'name',''))) < 2 or length(v_phone) < 10 or length(trim(coalesce(p->>'address',''))) < 4 then
    raise exception 'name, 10 digit phone and address are required';
  end if;
  insert into households (season, name, phone, lang, adults, kids, address, area, landmark, notes, priority,
                          lat, lng, free, song_ids, custom_songs, edit_code, consent, created_via)
  values (v_season, trim(p->>'name'), v_phone, coalesce(p->>'lang','en'),
          coalesce((p->>'adults')::int, 2), coalesce((p->>'kids')::int, 0), trim(p->>'address'),
          coalesce(p->>'area',''), coalesce(p->>'landmark',''), coalesce(p->>'notes',''),
          coalesce((p->>'priority')::boolean, false),
          nullif(p->>'lat','')::double precision, nullif(p->>'lng','')::double precision,
          coalesce(p->'free', '{}'::jsonb),
          coalesce(array(select jsonb_array_elements_text(p->'songIds')), '{}'),
          coalesce(array(select jsonb_array_elements_text(p->'customSongs')), '{}'),
          v_code, true,
          case when p->>'via' in ('app','phone','paper','captain') then p->>'via' else 'app' end)
  returning id into v_id;
  -- phone / paper entries made by an admin log who added them
  if is_admin() then
    insert into visit_events (actor, actor_name, household_id, action, to_status)
    values (auth.uid(), coalesce((select display_name from admins where user_id = auth.uid()), 'unknown'), v_id, 'enrolled', p->>'via');
  end if;
  return jsonb_build_object('id', v_id, 'code', v_code, 'phone', v_phone);
end $$;

create or replace function lookup_household(p_phone text, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  h households%rowtype;
  v visits%rowtype;
begin
  select * into h from households
   where phone = right(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g'), 10) and edit_code = trim(p_code)
   order by created_at desc limit 1;
  if not found then return null; end if;
  select * into v from visits where household_id = h.id and day >= current_date order by day limit 1;
  return jsonb_build_object('id', h.id, 'name', h.name, 'address', h.address, 'area', h.area,
    'visit', case when v.id is null then null else jsonb_build_object('date', v.day, 'status', v.status) end);
end $$;

grant execute on function enrol_household(jsonb) to anon, authenticated;
grant execute on function lookup_household(text, text) to anon, authenticated;

-- 5. Log pin changes under the admin's name (status changes are already logged by visits_audit)
create or replace function log_pin_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.lat, new.lng) is distinct from (old.lat, old.lng) and auth.uid() is not null then
    insert into visit_events (actor, actor_name, household_id, action, to_status)
    values (auth.uid(), coalesce((select display_name from admins where user_id = auth.uid()), 'unknown'),
            new.id, 'pin-set', round(new.lat::numeric, 5) || ', ' || round(new.lng::numeric, 5));
  end if;
  return new;
end $$;
drop trigger if exists households_pin_audit on households;
create trigger households_pin_audit after update on households for each row execute function log_pin_change();

-- 6. Make the status trigger also run when the plan is first written, and keep names safe
create or replace function log_visit_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into visit_events (actor, actor_name, household_id, day, action, from_status, to_status)
    values (auth.uid(), coalesce((select display_name from admins where user_id = auth.uid()), 'unknown'),
            new.household_id, new.day,
            case new.status when 'arrived' then 'check-in' when 'done' then 'check-out'
                 when 'planned' then 'undo' when 'told' then 'told by WhatsApp' else new.status end,
            old.status, new.status);
  end if;
  return new;
end $$;

-- 7. Add each admin AFTER creating their login in Authentication > Users. Edit and run per person:
-- insert into admins (user_id, display_name, role)
-- select id, 'Fr. Anthony', 'priest' from auth.users where email = 'priest@example.com'
-- on conflict (user_id) do update set display_name = excluded.display_name, role = excluded.role;
