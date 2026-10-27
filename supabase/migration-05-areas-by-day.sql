-- Families now share only their home, carols and prayer intentions. The team decides which area is visited
-- on which evening, then publishes. Run once in the SQL editor. Safe to run again.

alter table households add column if not exists prayer text not null default '';
alter table seasons add column if not exists published boolean not null default false;

-- One row per evening that has an area assigned.
create table if not exists day_areas (
  day date primary key,
  area text not null
);
alter table day_areas enable row level security;
drop policy if exists day_areas_admin on day_areas;
create policy day_areas_admin on day_areas for all using (is_admin()) with check (is_admin());

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
  insert into households (season, name, phone, lang, adults, kids, address, area, landmark, notes, prayer, priority,
                          lat, lng, free, song_ids, custom_songs, edit_code, consent, created_via)
  values (v_season, trim(p->>'name'), v_phone, coalesce(p->>'lang','en'),
          coalesce((p->>'adults')::int, 2), coalesce((p->>'kids')::int, 0), trim(p->>'address'),
          coalesce(p->>'area',''), coalesce(p->>'landmark',''), coalesce(p->>'notes',''), coalesce(p->>'prayer',''),
          coalesce((p->>'priority')::boolean, false),
          nullif(p->>'lat','')::double precision, nullif(p->>'lng','')::double precision,
          '{}'::jsonb,
          coalesce(array(select jsonb_array_elements_text(p->'songIds')), '{}'),
          coalesce(array(select jsonb_array_elements_text(p->'customSongs')), '{}'),
          v_code, true,
          case when p->>'via' in ('app','phone','paper','captain') then p->>'via' else 'app' end)
  returning id into v_id;
  if is_admin() then
    insert into visit_events (actor, actor_name, household_id, action, to_status)
    values (auth.uid(), coalesce((select display_name from admins where user_id = auth.uid()), 'unknown'), v_id, 'enrolled', p->>'via');
  end if;
  return jsonb_build_object('id', v_id, 'code', v_code, 'phone', v_phone);
end $$;

-- A family only sees its visit day after the team has published the plan.
create or replace function lookup_household(p_phone text, p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  h households%rowtype;
  v visits%rowtype;
  v_pub boolean := coalesce((select published from seasons order by year desc limit 1), false);
begin
  select * into h from households
   where phone = right(regexp_replace(coalesce(p_phone,''), '[^0-9]', '', 'g'), 10) and edit_code = trim(p_code)
   order by created_at desc limit 1;
  if not found then return null; end if;
  if v_pub then
    select * into v from visits where household_id = h.id and day >= current_date order by day limit 1;
  end if;
  return jsonb_build_object('id', h.id, 'name', h.name, 'address', h.address, 'area', h.area,
    'visit', case when v.id is null then null else jsonb_build_object('date', v.day, 'status', v.status) end);
end $$;

grant execute on function enrol_household(jsonb) to anon, authenticated;
grant execute on function lookup_household(text, text) to anon, authenticated;
