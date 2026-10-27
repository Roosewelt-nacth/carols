-- Fixes an infinite loop: is_admin() read the admins table, whose own rule called is_admin() again.
-- Run once in the SQL editor. Safe to run again.

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
  $$ select exists (select 1 from admins where user_id = auth.uid()) $$;

drop policy if exists admin_read_admins on admins;
create policy admin_read_admins on admins for select using (user_id = auth.uid() or is_admin());
