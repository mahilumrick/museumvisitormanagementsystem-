-- Run this in Supabase: SQL Editor -> New query -> Run
create extension if not exists "pgcrypto";

create table if not exists visitors (
  id            uuid primary key default gen_random_uuid(),
  ticket_code   text unique not null,
  full_name     text not null check (char_length(full_name) between 2 and 60),
  email         text not null,
  age           int  not null check (age between 1 and 120),
  visitor_type  text not null default 'Regular'
                check (visitor_type in ('Regular','Student','Senior','PWD','VIP')),
  group_size    int  not null default 1 check (group_size between 1 and 50),
  visit_date    date not null,
  status        text not null default 'Registered'
                check (status in ('Registered','Queued','Checked-in','Checked-out')),
  queued_at     timestamptz,
  checkin_time  timestamptz,
  checkout_time timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists visit_logs (
  id           uuid primary key default gen_random_uuid(),
  action       text not null,
  visitor_name text,
  ticket_code  text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_visitors_status on visitors(status);
create index if not exists idx_visitors_visit_date on visitors(visit_date);

-- The backend uses the service_role key (bypasses RLS). Keep RLS on so the
-- tables are not publicly writable with the anon key.
alter table visitors   enable row level security;
alter table visit_logs enable row level security;
