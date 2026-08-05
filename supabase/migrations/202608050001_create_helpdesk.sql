-- HelpDesk Lite prototype schema.
-- The anon policies below make the browser-only demo usable without auth.
-- Replace them with authenticated, organization-scoped policies before production.

create sequence if not exists public.ticket_number_seq start with 1025;

create or replace function public.next_ticket_id()
returns text
language sql
security invoker
set search_path = ''
as $$
  select 'HD-' || nextval('public.ticket_number_seq')::text;
$$;

create table if not exists public.tickets (
  id text primary key default public.next_ticket_id(),
  subject text not null check (char_length(subject) between 3 and 160),
  description text not null check (char_length(description) between 10 and 5000),
  requester_name text not null check (char_length(requester_name) between 2 and 100),
  requester_email text not null check (requester_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  category text not null default 'Technical Issue',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'On Hold', 'Resolved')),
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id bigint generated always as identity primary key,
  ticket_id text not null references public.tickets(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  kind text not null default 'reply' check (kind in ('reply', 'note')),
  author_name text not null,
  author_role text not null default 'agent' check (author_role in ('requester', 'agent')),
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_attachments (
  id bigint generated always as identity primary key,
  ticket_id text not null references public.tickets(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

create or replace function public.touch_parent_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_ticket on public.ticket_messages;
create trigger messages_touch_ticket
after insert on public.ticket_messages
for each row execute function public.touch_parent_ticket();

drop trigger if exists attachments_touch_ticket on public.ticket_attachments;
create trigger attachments_touch_ticket
after insert on public.ticket_attachments
for each row execute function public.touch_parent_ticket();

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_attachments enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.tickets to anon, authenticated;
grant select, insert on public.ticket_messages to anon, authenticated;
grant select, insert on public.ticket_attachments to anon, authenticated;
grant usage, select on sequence public.ticket_number_seq to anon, authenticated;
grant usage, select on sequence public.ticket_messages_id_seq to anon, authenticated;
grant usage, select on sequence public.ticket_attachments_id_seq to anon, authenticated;

drop policy if exists "prototype read tickets" on public.tickets;
drop policy if exists "prototype create tickets" on public.tickets;
drop policy if exists "prototype update tickets" on public.tickets;
create policy "prototype read tickets" on public.tickets for select to anon, authenticated using (true);
create policy "prototype create tickets" on public.tickets for insert to anon, authenticated with check (true);
create policy "prototype update tickets" on public.tickets for update to anon, authenticated using (true) with check (true);

drop policy if exists "prototype read messages" on public.ticket_messages;
drop policy if exists "prototype create messages" on public.ticket_messages;
create policy "prototype read messages" on public.ticket_messages for select to anon, authenticated using (true);
create policy "prototype create messages" on public.ticket_messages for insert to anon, authenticated with check (true);

drop policy if exists "prototype read attachments" on public.ticket_attachments;
drop policy if exists "prototype create attachments" on public.ticket_attachments;
create policy "prototype read attachments" on public.ticket_attachments for select to anon, authenticated using (true);
create policy "prototype create attachments" on public.ticket_attachments for insert to anon, authenticated with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ticket-attachments', 'ticket-attachments', false, 10485760, array['image/png', 'image/jpeg', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "prototype read ticket files" on storage.objects;
drop policy if exists "prototype upload ticket files" on storage.objects;
create policy "prototype read ticket files" on storage.objects for select to anon, authenticated
using (bucket_id = 'ticket-attachments');
create policy "prototype upload ticket files" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'ticket-attachments');
drop policy if exists "prototype delete ticket files" on storage.objects;
create policy "prototype delete ticket files" on storage.objects for delete to anon, authenticated
using (bucket_id = 'ticket-attachments');

insert into public.tickets (id, subject, description, requester_name, requester_email, category, priority, status, updated_at)
values
  ('HD-1024', 'Unable to process refund for order #NV-4481', 'I receive an Internal API Error whenever I confirm the refund.', 'Mara Velasquez', 'mara@example.com', 'Billing', 'High', 'In Progress', now() - interval '4 minutes'),
  ('HD-1023', 'VPN disconnecting every few minutes', 'The VPN disconnects every few minutes while I work remotely.', 'Noah Williams', 'noah@example.com', 'Technical', 'Urgent', 'Open', now() - interval '12 minutes'),
  ('HD-1022', 'Access request for Finance workspace', 'Please grant access to the Finance workspace for month-end reporting.', 'Amina Hassan', 'amina@example.com', 'Access', 'Medium', 'On Hold', now() - interval '28 minutes'),
  ('HD-1021', 'New starter laptop setup', 'A new team member needs a laptop and standard software configured.', 'Liam Chen', 'liam@example.com', 'Hardware', 'Low', 'Open', now() - interval '43 minutes'),
  ('HD-1019', 'Invoice export is missing April records', 'The invoice export does not include records created during April.', 'Sofia Martinez', 'sofia@example.com', 'Billing', 'High', 'In Progress', now() - interval '1 hour')
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;
end $$;
