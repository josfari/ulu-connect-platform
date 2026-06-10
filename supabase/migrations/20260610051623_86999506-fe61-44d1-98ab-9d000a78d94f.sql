-- ============ ENUMS ============
create type public.app_role as enum ('super_admin', 'admin', 'editor');
create type public.project_status as enum ('planned', 'ongoing', 'completed');
create type public.member_status as enum ('pending', 'active', 'executive', 'volunteer', 'inactive');
create type public.post_status as enum ('draft', 'published');
create type public.loan_status as enum ('active', 'repaid', 'defaulted');

-- ============ TIMESTAMP TRIGGER ============
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('super_admin','admin'))
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create policy "Users can view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Super admins can view all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'super_admin'));

-- Auto-create profile on signup; first user becomes super_admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ MEMBERS ============
create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text,
  membership_category text not null default 'General Member',
  phone text,
  email text,
  show_contact boolean not null default false,
  status public.member_status not null default 'pending',
  date_joined date not null default current_date,
  photo_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.members to service_role;
grant select, insert, update, delete on public.members to authenticated;
alter table public.members enable row level security;
create policy "Admins manage members" on public.members for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger members_updated_at before update on public.members for each row execute function public.set_updated_at();

-- ============ PROJECTS ============
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  status public.project_status not null default 'planned',
  budget numeric(12,2),
  progress int not null default 0 check (progress between 0 and 100),
  impact_summary text,
  category text not null default 'Community',
  date_started date,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "Projects are publicly readable" on public.projects for select using (true);
create policy "Admins manage projects" on public.projects for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "Admins update projects" on public.projects for update to authenticated using (public.is_admin(auth.uid()));
create policy "Admins delete projects" on public.projects for delete to authenticated using (public.is_admin(auth.uid()));
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

-- ============ STAFF / LEADERSHIP ============
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  photo_url text,
  bio text,
  role_description text,
  email text,
  phone text,
  show_contact boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.staff to anon;
grant select, insert, update, delete on public.staff to authenticated;
grant all on public.staff to service_role;
alter table public.staff enable row level security;
create policy "Staff are publicly readable" on public.staff for select using (true);
create policy "Admins manage staff insert" on public.staff for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "Admins manage staff update" on public.staff for update to authenticated using (public.is_admin(auth.uid()));
create policy "Admins manage staff delete" on public.staff for delete to authenticated using (public.is_admin(auth.uid()));
create trigger staff_updated_at before update on public.staff for each row execute function public.set_updated_at();

-- ============ CATEGORIES & TAGS ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories publicly readable" on public.categories for select using (true);
create policy "Staff manage categories insert" on public.categories for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff manage categories update" on public.categories for update to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage categories delete" on public.categories for delete to authenticated using (public.is_staff(auth.uid()));

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);
grant select on public.tags to anon;
grant select, insert, update, delete on public.tags to authenticated;
grant all on public.tags to service_role;
alter table public.tags enable row level security;
create policy "Tags publicly readable" on public.tags for select using (true);
create policy "Staff manage tags insert" on public.tags for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff manage tags update" on public.tags for update to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage tags delete" on public.tags for delete to authenticated using (public.is_staff(auth.uid()));

-- ============ POSTS ============
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  status public.post_status not null default 'draft',
  featured boolean not null default false,
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "Published posts publicly readable" on public.posts for select using (status = 'published' or public.is_staff(auth.uid()));
create policy "Staff create posts" on public.posts for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff update posts" on public.posts for update to authenticated using (public.is_staff(auth.uid()));
create policy "Staff delete posts" on public.posts for delete to authenticated using (public.is_staff(auth.uid()));
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
grant select on public.post_tags to anon;
grant select, insert, update, delete on public.post_tags to authenticated;
grant all on public.post_tags to service_role;
alter table public.post_tags enable row level security;
create policy "Post tags publicly readable" on public.post_tags for select using (true);
create policy "Staff manage post tags insert" on public.post_tags for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff manage post tags delete" on public.post_tags for delete to authenticated using (public.is_staff(auth.uid()));

-- ============ GALLERY ============
create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  caption text,
  category text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.gallery_images to anon;
grant select, insert, update, delete on public.gallery_images to authenticated;
grant all on public.gallery_images to service_role;
alter table public.gallery_images enable row level security;
create policy "Gallery publicly readable" on public.gallery_images for select using (true);
create policy "Staff manage gallery insert" on public.gallery_images for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff manage gallery update" on public.gallery_images for update to authenticated using (public.is_staff(auth.uid()));
create policy "Staff manage gallery delete" on public.gallery_images for delete to authenticated using (public.is_staff(auth.uid()));

-- ============ FINANCIAL: CONTRIBUTIONS, LOANS, REPAYMENTS ============
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  contribution_date date not null default current_date,
  note text,
  recorded_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.contributions to authenticated;
grant all on public.contributions to service_role;
alter table public.contributions enable row level security;
create policy "Admins manage contributions" on public.contributions for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  principal numeric(12,2) not null check (principal > 0),
  interest_rate numeric(5,2) not null default 0,
  issued_date date not null default current_date,
  due_date date,
  status public.loan_status not null default 'active',
  note text,
  recorded_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.loans to authenticated;
grant all on public.loans to service_role;
alter table public.loans enable row level security;
create policy "Admins manage loans" on public.loans for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger loans_updated_at before update on public.loans for each row execute function public.set_updated_at();

create table public.repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  repayment_date date not null default current_date,
  note text,
  recorded_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.repayments to authenticated;
grant all on public.repayments to service_role;
alter table public.repayments enable row level security;
create policy "Admins manage repayments" on public.repayments for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ============ CONTACT & NEWSLETTER (inserts via server fn with service role) ============
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "Admins view contact messages" on public.contact_messages for select to authenticated using (public.is_admin(auth.uid()));
create policy "Admins update contact messages" on public.contact_messages for update to authenticated using (public.is_admin(auth.uid()));
create policy "Admins delete contact messages" on public.contact_messages for delete to authenticated using (public.is_admin(auth.uid()));

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);
grant select, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "Admins view subscribers" on public.newsletter_subscribers for select to authenticated using (public.is_admin(auth.uid()));
create policy "Admins delete subscribers" on public.newsletter_subscribers for delete to authenticated using (public.is_admin(auth.uid()));

-- ============ STORAGE RLS (bucket created via tool) ============
create policy "Public read media bucket" on storage.objects for select using (bucket_id = 'media');
create policy "Staff upload to media bucket" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "Staff update media bucket" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "Staff delete media bucket" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));