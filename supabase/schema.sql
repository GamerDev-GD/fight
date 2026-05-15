-- Run this in Supabase → SQL Editor as a single script.
-- It creates the minimum tables + Row Level Security for this static storefront.

-- 1) PRODUCTS (what you sell)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  currency text not null default 'INR',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) ORDERS (checkout form writes one row per submission)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  phone text,
  address_line text,
  city text,
  postal_code text,
  country text default 'India',
  notes text,
  cart_json jsonb not null,
  total_amount numeric not null check (total_amount >= 0),
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists products_active_idx on public.products (is_active);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- Row Level Security
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Anyone can read active catalog rows (anon key in the browser).
drop policy if exists "public read active products" on public.products;
create policy "public read active products"
on public.products
for select
to anon, authenticated
using (is_active = true);

-- Anyone can place an order from the marketing site.
-- NOTE: This is convenient for learning; in production add CAPTCHA, rate limits,
-- Edge Functions, or authenticated checkout to reduce spam.
drop policy if exists "public insert orders" on public.orders;
create policy "public insert orders"
on public.orders
for insert
to anon, authenticated
with check (true);

-- No public read on orders (customers should not browse each other's rows).
drop policy if exists "no public read orders" on public.orders;
create policy "no public read orders"
on public.orders
for select
to anon
using (false);

-- Optional seed so your grid is not empty on first load.
insert into public.products (product_code, name, description, price, currency, image_url)
values
  ('MD-VNT-01', 'Night Match Vintage Tee', 'Garment-dyed heavyweight cotton.', 1799, 'INR',
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
  ('MD-LEG-04', 'Legacies Oversized Hoodie', 'Brushed fleece, dropped shoulder.', 2899, 'INR',
   'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80')
on conflict (product_code) do nothing;
