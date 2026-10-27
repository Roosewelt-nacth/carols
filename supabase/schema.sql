-- Carols: Supabase schema (run in the SQL editor). Only admins can read addresses.

create table seasons (
  year int primary key,
  advent_start date not null,
  christmas date not null,
  max_per_evening int not null default 12,
  map_lat double precision default 13.0735,
  map_lng double precision default 80.223
);

create table areas (
  id uuid primary key default gen_random_uuid(),
  season int references seasons(year) on delete cascade,
  name text not null
);

create table households (
  id uuid primary key default gen_random_uuid(),
  season int references seasons(year) on delete cascade,
  name text not null,
  phone text not null,
  lang text not null default 'en' check (lang in ('en','ta')),
  adults int not null default 2,
  kids int not null default 0,
  address text not null,
  area_id uuid references areas(id),
  landmark text default '',
  notes text default '',
  priority boolean not null default false,
  lat double precision,
  lng double precision,
  edit_code text not null,                 -- 4-digit code the family keeps
  consent boolean not null default false,
  created_via text not null default 'app' check (created_via in ('app','phone','paper','captain')),
  created_at timestamptz not null default now()
);

create table availability (
  household_id uuid references households(id) on delete cascade,
  day date not null,
  slot text not null check (slot in ('any','early','evening','late')),
  primary key (household_id, day)
);

create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  lang text not null default 'en'
);

create table song_requests (
  household_id uuid references households(id) on delete cascade,
  song_id uuid references songs(id),
  custom_title text,
  check (song_id is not null or custom_title is not null)
);

create table visits (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  day date not null,
  position int not null,
  status text not null default 'planned' check (status in ('planned','told','arrived','done','missed')),
  unique (household_id, day)
);

-- Who changed what, and when. Written by a trigger so it cannot be skipped.
create table visit_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid references auth.users(id),
  actor_name text not null,
  household_id uuid references households(id) on delete cascade,
  day date,
  action text not null,
  from_status text,
  to_status text
);

create table admins (
  user_id uuid primary key references auth.users(id),
  display_name text not null,
  role text not null default 'coordinator' check (role in ('priest','coordinator','captain'))
);

create or replace function is_admin() returns boolean language sql stable as
  $$ select exists (select 1 from admins where user_id = auth.uid()) $$;

create or replace function log_visit_change() returns trigger language plpgsql security definer as $$
begin
  if new.status is distinct from old.status then
    insert into visit_events (actor, actor_name, household_id, day, action, from_status, to_status)
    values (auth.uid(), coalesce((select display_name from admins where user_id = auth.uid()), 'unknown'),
            new.household_id, new.day,
            case new.status when 'arrived' then 'check-in' when 'done' then 'check-out'
                 when 'planned' then 'undo' else new.status end,
            old.status, new.status);
  end if;
  return new;
end $$;
create trigger visits_audit after update on visits for each row execute function log_visit_change();

alter table households enable row level security;
alter table availability enable row level security;
alter table visits enable row level security;
alter table visit_events enable row level security;
alter table song_requests enable row level security;
alter table admins enable row level security;

-- Families insert via an edge function that checks the edit code; direct reads are admin only.
create policy admin_all_households on households for all using (is_admin()) with check (is_admin());
create policy admin_all_availability on availability for all using (is_admin()) with check (is_admin());
create policy admin_all_visits on visits for all using (is_admin()) with check (is_admin());
create policy admin_read_events on visit_events for select using (is_admin());
create policy admin_all_requests on song_requests for all using (is_admin()) with check (is_admin());
create policy admin_read_admins on admins for select using (is_admin());
create policy songs_public_read on songs for select using (true);
