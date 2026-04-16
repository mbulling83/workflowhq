-- migrations/001_user_connections.sql

-- Enable pgcrypto for gen_random_uuid (already available in Supabase but safe to include)
create extension if not exists "pgcrypto";

-- Store each user's n8n connection details
create table public.user_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  n8n_url       text not null,
  -- API key stored as a Vault secret; this column holds the secret name reference
  api_key_secret text not null,
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id)
);

-- Row Level Security
alter table public.user_connections enable row level security;

create policy "Users can view their own connection"
  on public.user_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own connection"
  on public.user_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own connection"
  on public.user_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own connection"
  on public.user_connections for delete
  using (auth.uid() = user_id);

-- Automatically update updated_at on change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_connections_updated_at
  before update on public.user_connections
  for each row execute procedure public.handle_updated_at();
