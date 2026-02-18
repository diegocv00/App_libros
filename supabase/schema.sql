create extension if not exists "pgcrypto";

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  description text not null,
  condition text not null,
  review text,
  price numeric not null,
  category text,
  publisher text,
  edition text,
  year text,
  location text,
  photo_url text,
  seller_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  topic text not null,
  description text not null,
  rules text,
  location text,
  member_count integer default 1,
  created_at timestamp with time zone default now()
);

