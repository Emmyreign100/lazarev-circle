-- Call requests. Staff can approve only after the €650 fee is recorded as paid.

create table if not exists call_requests (
  id serial primary key,
  user_id text not null,
  reason text not null,
  amount_eur int not null default 650,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'approved', 'rejected')),
  paid_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists call_requests_user_idx on call_requests (user_id, created_at desc);
