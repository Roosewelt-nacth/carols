-- Lyrics for carols the team adds. The built-in public domain carols ship with the app. Run once, safe to run again.
alter table songs add column if not exists lyrics text not null default '';
