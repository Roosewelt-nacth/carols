-- Anbiyams with their leaders, house blessing and away evenings. Run once in the SQL editor. Safe to run again.

alter table households add column if not exists blessing boolean not null default false;
alter table households add column if not exists away_dates date[] not null default '{}';

-- Leaders are private to the team. The anbiyam names themselves stay in seasons.areas so families can pick one.
create table if not exists anbiyam_leaders (
  name text primary key,
  leader text not null default '',
  phone text not null default ''
);
alter table anbiyam_leaders enable row level security;
drop policy if exists anbiyam_leaders_admin on anbiyam_leaders;
create policy anbiyam_leaders_admin on anbiyam_leaders for all using (is_admin()) with check (is_admin());

-- Replace the placeholder zones with numbered anbiyams. Rename them to the real ones in the app (More > Anbiyams).
alter table seasons alter column areas set default array['Anbiyam 1','Anbiyam 2','Anbiyam 3','Anbiyam 4','Anbiyam 5','Anbiyam 6','Anbiyam 7','Anbiyam 8'];
update seasons set areas = array['Anbiyam 1','Anbiyam 2','Anbiyam 3','Anbiyam 4','Anbiyam 5','Anbiyam 6','Anbiyam 7','Anbiyam 8']
 where areas = array['Zone A','Zone B','Zone C','Zone D'];

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
  insert into households (season, name, phone, lang, adults, kids, address, area, landmark, notes, prayer, priority, blessing, away_dates,
                          lat, lng, free, song_ids, custom_songs, edit_code, consent, created_via)
  values (v_season, trim(p->>'name'), v_phone, coalesce(p->>'lang','en'),
          coalesce((p->>'adults')::int, 0), coalesce((p->>'kids')::int, 0), trim(p->>'address'),
          coalesce(p->>'area',''), coalesce(p->>'landmark',''), coalesce(p->>'notes',''), coalesce(p->>'prayer',''),
          coalesce((p->>'priority')::boolean, false), coalesce((p->>'blessing')::boolean, false),
          coalesce(array(select jsonb_array_elements_text(p->'away'))::date[], '{}'),
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
grant execute on function enrol_household(jsonb) to anon, authenticated;
