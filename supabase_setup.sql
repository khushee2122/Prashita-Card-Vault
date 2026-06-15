-- ============================================================
-- CARDVAULT — Supabase Setup
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- 1. ORGANISATIONS
create table if not exists public.orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- 2. USER PROFILES (extends Supabase Auth)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid references public.orgs(id) on delete cascade,
  full_name   text,
  role        text default 'member' check (role in ('admin','member')),
  created_at  timestamptz default now()
);

-- 3. EXHIBITIONS
create table if not exists public.exhibitions (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.orgs(id) on delete cascade,
  name        text not null,
  location    text,
  start_date  date,
  end_date    date,
  status      text default 'active' check (status in ('active','archived')),
  created_at  timestamptz default now()
);

-- 4. LEADS
create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid references public.orgs(id) on delete cascade,
  exhibition_id     uuid references public.exhibitions(id) on delete set null,
  scanned_by        uuid references public.profiles(id) on delete set null,

  -- Contact fields
  company_name      text,
  contact_person    text,
  mobile            text,
  email             text,
  address           text,
  designation       text,
  city              text,
  state             text,
  country           text,
  website           text,
  company_context   text,
  lead_type         text check (lead_type in ('vendor','client','other')),
  notes             text,

  -- Card images stored as URLs in Supabase Storage
  card_front_url    text,
  card_back_url     text,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- 5. INVITES (for team member invitations)
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.orgs(id) on delete cascade,
  email       text not null,
  invited_by  uuid references public.profiles(id) on delete set null,
  accepted    boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.orgs        enable row level security;
alter table public.profiles    enable row level security;
alter table public.exhibitions enable row level security;
alter table public.leads       enable row level security;
alter table public.invites     enable row level security;

-- Helper: get current user's org_id
create or replace function public.my_org_id()
returns uuid language sql stable security definer as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select role = 'admin' from public.profiles where id = auth.uid()
$$;

-- ORGS: users can only see their own org
create policy "orgs_select" on public.orgs for select
  using (id = public.my_org_id());

create policy "orgs_insert" on public.orgs for insert
  with check (true); -- anyone can create an org (signup flow)

create policy "orgs_update" on public.orgs for update
  using (id = public.my_org_id() and public.is_admin());

-- PROFILES: see only profiles in same org
create policy "profiles_select" on public.profiles for select
  using (org_id = public.my_org_id());

create policy "profiles_insert" on public.profiles for insert
  with check (true); -- handled by signup trigger

create policy "profiles_update" on public.profiles for update
  using (id = auth.uid() or (org_id = public.my_org_id() and public.is_admin()));

create policy "profiles_delete" on public.profiles for delete
  using (org_id = public.my_org_id() and public.is_admin() and id != auth.uid());

-- EXHIBITIONS: org-scoped
create policy "exhibitions_select" on public.exhibitions for select
  using (org_id = public.my_org_id());

create policy "exhibitions_insert" on public.exhibitions for insert
  with check (org_id = public.my_org_id());

create policy "exhibitions_update" on public.exhibitions for update
  using (org_id = public.my_org_id() and public.is_admin());

create policy "exhibitions_delete" on public.exhibitions for delete
  using (org_id = public.my_org_id() and public.is_admin());

-- LEADS: org-scoped
create policy "leads_select" on public.leads for select
  using (org_id = public.my_org_id());

create policy "leads_insert" on public.leads for insert
  with check (org_id = public.my_org_id());

create policy "leads_update" on public.leads for update
  using (org_id = public.my_org_id());

create policy "leads_delete" on public.leads for delete
  using (org_id = public.my_org_id());

-- INVITES: org-scoped
create policy "invites_select" on public.invites for select
  using (org_id = public.my_org_id() or email = (select email from auth.users where id = auth.uid()));

create policy "invites_insert" on public.invites for insert
  with check (org_id = public.my_org_id() and public.is_admin());

create policy "invites_update" on public.invites for update
  using (email = (select email from auth.users where id = auth.uid()));

-- ============================================================
-- AUTO-UPDATE updated_at on leads
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

-- ============================================================
-- REALTIME: enable for leads table
-- ============================================================
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.exhibitions;

-- ============================================================
-- STORAGE: card images bucket
-- Run this in Supabase Dashboard → Storage → New Bucket
-- Name: card-images | Public: false
-- ============================================================
-- Then add these storage policies in Dashboard → Storage → Policies:
-- 1. INSERT: authenticated users whose org matches folder name
-- 2. SELECT: authenticated users whose org matches folder name
-- (Storage policies are set in the Dashboard UI, not SQL)

-- ============================================================
-- DONE. Next: set up Storage bucket named "card-images"
-- ============================================================
