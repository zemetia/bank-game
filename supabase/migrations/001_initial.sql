-- BankGame schema
-- Run this in your Supabase SQL editor or via `supabase db push`

create extension if not exists "pgcrypto";

-- ─── rooms ───────────────────────────────────────────────────────────────────
create table rooms (
  id          uuid primary key default gen_random_uuid(),
  code        varchar(6)  not null unique,
  name        text        not null,
  created_at  timestamptz not null default now()
);

create index rooms_code_idx on rooms (code);

-- ─── room_users ──────────────────────────────────────────────────────────────
create table room_users (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid        not null references rooms (id) on delete cascade,
  name        text        not null,
  user_code   varchar(10) not null,
  pin_hash    text        not null,
  balance     bigint      not null default 0,  -- stored in smallest currency unit (e.g. cents)
  is_master   boolean     not null default false,
  created_at  timestamptz not null default now(),
  unique (room_id, user_code)
);

create index room_users_room_id_idx  on room_users (room_id);
create index room_users_user_code_idx on room_users (room_id, user_code);

-- ─── transactions ─────────────────────────────────────────────────────────────
create table transactions (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid        not null references rooms (id) on delete cascade,
  from_user_id  uuid        references room_users (id) on delete set null,
  to_user_id    uuid        references room_users (id) on delete set null,
  amount        bigint      not null check (amount > 0),
  type          text        not null check (type in ('deposit', 'withdraw', 'transfer')),
  note          text,
  created_by    uuid        not null references room_users (id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index transactions_room_id_idx on transactions (room_id, created_at desc);
create index transactions_from_user_idx on transactions (from_user_id);
create index transactions_to_user_idx   on transactions (to_user_id);

-- ─── helpers ─────────────────────────────────────────────────────────────────
create or replace function increment_balance(user_id uuid, delta bigint)
returns void
language sql
as $$
  update room_users set balance = balance + delta where id = user_id;
$$;
