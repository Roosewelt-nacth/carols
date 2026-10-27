-- Security fix. Row level security was never switched on for the songs and areas tables, so anyone with the
-- public app key could add or change carols. This turns it on for EVERY table in the public schema and
-- restores the rules the app needs. Safe to run again.

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Carols: everyone can read the list, only admins can change it.
drop policy if exists songs_public_read on songs;
drop policy if exists admin_write_songs on songs;
create policy songs_public_read on songs for select using (true);
create policy admin_write_songs on songs for all using (is_admin()) with check (is_admin());

-- Season settings (anbiyam names, publish switch): everyone reads, only admins change.
drop policy if exists seasons_read on seasons;
drop policy if exists seasons_admin_write on seasons;
create policy seasons_read on seasons for select using (true);
create policy seasons_admin_write on seasons for all using (is_admin()) with check (is_admin());

-- The old areas table is unused. With security on and no rule, nobody can touch it.
