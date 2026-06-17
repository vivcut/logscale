-- 1. Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 2. Create Profiles Table (Syncs with Supabase Auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null  
);

-- 3. Create Workspaces Table
create table public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Workspace Members Table (Roles)
create table public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (workspace_id, profile_id)
);

-- 5. Create Feedback Boards Table
create table public.boards (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  slug text not null,
  description text,
  is_private boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (workspace_id, slug)
);

-- 6. Create Feedback Posts Table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null, -- Nullable for fingerprinted anonymous tracking
  fingerprint_hash text, -- Fallback identifier for anonymous voting validation
  title text not null,
  description text,
  status text check (status in ('under-review', 'planned', 'in-progress', 'completed', 'closed')) default 'under-review' not null,
  upvotes_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create Upvotes Table
create table public.upvotes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  fingerprint_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create constraints to ensure unique upvotes per user or per fingerprint device
create unique index upvotes_user_post_idx on public.upvotes (post_id, user_id) where user_id is not null;
create unique index upvotes_fingerprint_post_idx on public.upvotes (post_id, fingerprint_hash) where user_id is null;

-- 8. Create Comments Table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create Changelogs Table
create table public.changelogs (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  content text not null, -- Markdown content
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Create Billing Subscriptions Table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade unique not null,
  stripe_customer_id text unique not null,
  stripe_subscription_id text unique,
  status text,
  plan_tier text check (plan_tier in ('free', 'pro')) default 'free' not null,
  current_period_end timestamp with time zone
);

-- Enable Row Level Security (RLS) across public tables
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards enable row level security;
alter table public.posts enable row level security;
alter table public.upvotes enable row level security;
alter table public.comments enable row level security;
alter table public.changelogs enable row level security;
alter table public.subscriptions enable row level security;
