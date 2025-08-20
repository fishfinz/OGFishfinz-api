-- All-in-one DB with seasons/claims
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

create table if not exists public.profiles (
  player_id text primary key,
  best_score integer not null default 0,
  last_seen timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references public.profiles(player_id) on delete cascade,
  score integer not null check (score >= 0),
  season integer not null default 1,
  created_at timestamptz not null default now()
);

create or replace function ensure_profile()
returns trigger language plpgsql as $$
begin
  insert into public.profiles (player_id) values (new.player_id)
  on conflict (player_id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_scores_ensure_profile on public.scores;
create trigger trg_scores_ensure_profile
before insert on public.scores
for each row execute function ensure_profile();

create or replace function update_best_score(p_player_id text, p_score integer)
returns void language plpgsql as $$
begin
  insert into public.profiles (player_id, best_score, last_seen)
  values (p_player_id, p_score, now())
  on conflict (player_id) do update
    set best_score = greatest(excluded.best_score, public.profiles.best_score),
        last_seen = now();
end; $$;

create index if not exists idx_scores_player_created on public.scores (player_id, created_at desc);

create table if not exists public.settings (
  key text primary key,
  value text not null
);
insert into public.settings(key,value) values ('current_season','1')
on conflict (key) do nothing;

create table if not exists public.season_profiles (
  season integer not null,
  player_id text not null,
  best_score integer not null default 0,
  last_seen timestamptz not null default now(),
  primary key (season, player_id)
);

create or replace function update_best_score_season(p_player_id text, p_score integer, p_season integer)
returns void language plpgsql as $$
begin
  insert into public.season_profiles (season, player_id, best_score, last_seen)
  values (p_season, p_player_id, p_score, now())
  on conflict (season, player_id) do update
    set best_score = greatest(excluded.best_score, season_profiles.best_score),
        last_seen = now();
end; $$;

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  season integer not null,
  player_id text not null,
  token_id integer not null,
  tx_hash text not null,
  created_at timestamptz not null default now(),
  unique (season, player_id)
);
