-- Team management from inside the app. Run once in the SQL editor. Safe to run again.
-- An admin (priest or coordinator) invites a person by email. That person opens the app, taps
-- "I was invited", creates a password, and is added automatically. No one can become an admin without an invite.

create table if not exists admin_invites (
  email text primary key,
  display_name text not null,
  role text not null default 'captain' check (role in ('priest','coordinator','captain')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table admin_invites enable row level security;

create or replace function can_manage_team() returns boolean
language sql stable security definer set search_path = public as
  $$ select exists (select 1 from admins where user_id = auth.uid() and role in ('priest','coordinator')) $$;

drop policy if exists team_invites_all on admin_invites;
create policy team_invites_all on admin_invites for all using (can_manage_team()) with check (can_manage_team());

drop policy if exists team_update_admins on admins;
drop policy if exists team_delete_admins on admins;
create policy team_update_admins on admins for update using (can_manage_team()) with check (can_manage_team());
create policy team_delete_admins on admins for delete using (can_manage_team());

-- Never leave the parish with no admin, and never with nobody who can manage the team.
create or replace function keep_a_manager() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from admins where role in ('priest','coordinator') and user_id <> old.user_id) = 0
     and old.role in ('priest','coordinator') then
    raise exception 'There must always be at least one priest or coordinator.';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists admins_keep_manager_del on admins;
create trigger admins_keep_manager_del before delete on admins for each row execute function keep_a_manager();
drop trigger if exists admins_keep_manager_upd on admins;
create trigger admins_keep_manager_upd before update of role on admins for each row
  when (new.role = 'captain') execute function keep_a_manager();

-- Called by the app right after someone signs in: turns a matching invite into admin access.
create or replace function claim_invite() returns boolean
language plpgsql security definer set search_path = public as $$
declare
  i admin_invites%rowtype;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or v_email = '' then return false; end if;
  select * into i from admin_invites where lower(email) = v_email;
  if not found then return false; end if;
  insert into admins (user_id, display_name, role) values (auth.uid(), i.display_name, i.role)
  on conflict (user_id) do update set display_name = excluded.display_name, role = excluded.role;
  delete from admin_invites where lower(email) = v_email;
  return true;
end $$;
grant execute on function claim_invite() to authenticated;
