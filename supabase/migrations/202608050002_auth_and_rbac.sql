-- Supabase Auth + role-based authorization for HelpDesk Lite.
-- Roles:
--   admin     full access, including role administration
--   manager   all tickets, reports, assignment, replies, and internal notes
--   agent     all tickets, assignment, replies, and internal notes
--   requester only their tickets, public replies, and attachments

do $$ begin
  create type public.app_role as enum ('admin', 'manager', 'agent', 'requester');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default 'New user',
  role public.app_role not null default 'requester',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, 'New user'), '@', 1)),
    case when exists (select 1 from public.profiles where role in ('admin', 'manager', 'agent')) then 'requester'::public.app_role else 'admin'::public.app_role end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, full_name, role)
select id, coalesce(email, ''), coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(email, 'New user'), '@', 1)), 'requester'
from auth.users
on conflict (id) do update set email = excluded.email;

-- Bootstrap the oldest account as the first administrator when no staff exists.
update public.profiles
set role = 'admin', updated_at = now()
where id = (select id from public.profiles order by created_at, id limit 1)
  and not exists (select 1 from public.profiles where role in ('admin', 'manager', 'agent'));

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('admin', 'manager', 'agent'), false);
$$;

create or replace function public.set_user_role(target_user_id uuid, new_role public.app_role)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.profiles;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'Only administrators can change user roles' using errcode = '42501';
  end if;
  if target_user_id = (select auth.uid()) then
    raise exception 'Administrators cannot change their own role';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_user_id returning * into updated_profile;
  if updated_profile.id is null then raise exception 'User not found'; end if;
  return updated_profile;
end;
$$;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;

alter table public.tickets add column if not exists requester_id uuid references auth.users(id) on delete set null default auth.uid();
alter table public.ticket_messages add column if not exists author_id uuid references auth.users(id) on delete set null default auth.uid();
alter table public.ticket_attachments add column if not exists uploaded_by uuid references auth.users(id) on delete set null default auth.uid();

create index if not exists tickets_requester_id_idx on public.tickets(requester_id);
create index if not exists ticket_messages_ticket_id_idx on public.ticket_messages(ticket_id);
create index if not exists ticket_attachments_ticket_id_idx on public.ticket_attachments(ticket_id);

drop policy if exists "prototype read tickets" on public.tickets;
drop policy if exists "prototype create tickets" on public.tickets;
drop policy if exists "prototype update tickets" on public.tickets;
drop policy if exists "staff or owner can read tickets" on public.tickets;
drop policy if exists "users can create their own tickets" on public.tickets;
drop policy if exists "staff can update tickets" on public.tickets;
create policy "staff or owner can read tickets" on public.tickets for select to authenticated
using (public.is_staff() or requester_id = (select auth.uid()));
create policy "users can create their own tickets" on public.tickets for insert to authenticated
with check (requester_id = (select auth.uid()));
create policy "staff can update tickets" on public.tickets for update to authenticated
using (public.is_staff()) with check (public.is_staff());

drop policy if exists "prototype read messages" on public.ticket_messages;
drop policy if exists "prototype create messages" on public.ticket_messages;
drop policy if exists "authorized users can read messages" on public.ticket_messages;
drop policy if exists "authorized users can create messages" on public.ticket_messages;
create policy "authorized users can read messages" on public.ticket_messages for select to authenticated
using (
  public.is_staff()
  or (
    kind = 'reply'
    and exists (select 1 from public.tickets where tickets.id = ticket_messages.ticket_id and tickets.requester_id = (select auth.uid()))
  )
);
create policy "authorized users can create messages" on public.ticket_messages for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (
    public.is_staff()
    or (
      kind = 'reply'
      and author_role = 'requester'
      and exists (select 1 from public.tickets where tickets.id = ticket_messages.ticket_id and tickets.requester_id = (select auth.uid()))
    )
  )
);

drop policy if exists "prototype read attachments" on public.ticket_attachments;
drop policy if exists "prototype create attachments" on public.ticket_attachments;
drop policy if exists "authorized users can read attachments" on public.ticket_attachments;
drop policy if exists "authorized users can create attachments" on public.ticket_attachments;
create policy "authorized users can read attachments" on public.ticket_attachments for select to authenticated
using (
  public.is_staff()
  or exists (select 1 from public.tickets where tickets.id = ticket_attachments.ticket_id and tickets.requester_id = (select auth.uid()))
);
create policy "authorized users can create attachments" on public.ticket_attachments for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (
    public.is_staff()
    or exists (select 1 from public.tickets where tickets.id = ticket_attachments.ticket_id and tickets.requester_id = (select auth.uid()))
  )
);

drop policy if exists "users can read permitted profiles" on public.profiles;
drop policy if exists "users can update their profile" on public.profiles;
create policy "users can read permitted profiles" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_staff());
create policy "users can update their profile" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke all on public.tickets, public.ticket_messages, public.ticket_attachments, public.profiles from anon;
revoke all on public.tickets, public.ticket_messages, public.ticket_attachments, public.profiles from authenticated;
grant select, insert, update on public.tickets to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select, insert on public.ticket_attachments to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant usage, select on sequence public.ticket_number_seq, public.ticket_messages_id_seq, public.ticket_attachments_id_seq to authenticated;
revoke all on sequence public.ticket_number_seq, public.ticket_messages_id_seq, public.ticket_attachments_id_seq from anon;

drop policy if exists "prototype read ticket files" on storage.objects;
drop policy if exists "prototype upload ticket files" on storage.objects;
drop policy if exists "prototype delete ticket files" on storage.objects;
drop policy if exists "authorized users can read ticket files" on storage.objects;
drop policy if exists "authorized users can upload ticket files" on storage.objects;
drop policy if exists "authorized users can delete ticket files" on storage.objects;
create policy "authorized users can read ticket files" on storage.objects for select to authenticated
using (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1 from public.tickets
    where tickets.id = (storage.foldername(name))[1]
      and (public.is_staff() or tickets.requester_id = (select auth.uid()))
  )
);
create policy "authorized users can upload ticket files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1 from public.tickets
    where tickets.id = (storage.foldername(name))[1]
      and (public.is_staff() or tickets.requester_id = (select auth.uid()))
  )
);
create policy "authorized users can delete ticket files" on storage.objects for delete to authenticated
using (
  bucket_id = 'ticket-attachments'
  and exists (
    select 1 from public.tickets
    where tickets.id = (storage.foldername(name))[1]
      and (public.is_staff() or tickets.requester_id = (select auth.uid()))
  )
);
