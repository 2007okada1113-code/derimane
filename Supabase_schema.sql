-- ============================================
-- DELIMANE データベーススキーマ
-- Supabase SQL Editor に貼り付けて実行する
-- ============================================

-- profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default 'ライダー',
  role text not null default 'user',
  goal integer default 100000,
  employment_type text default 'freelance',
  blue_return boolean default false,
  has_dependent boolean default false,
  other_annual_income integer default 0,
  active_apps text[] default array['ubereats'],
  total_km integer default 0,
  is_pro boolean default false,
  created_at timestamptz default now()
);

-- records
create table if not exists records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  earnings integer not null,
  base_earnings integer,
  boost integer default 0,
  quest integer default 0,
  tip integer default 0,
  hours numeric(5,2) not null,
  wait_hours numeric(5,2) default 0,
  distance numeric(6,1) default 0,
  apps text[] default array[]::text[],
  memo text default '',
  time_slot text default '',
  weather text default '',
  created_at timestamptz default now()
);

-- expenses
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  amount integer not null,
  category text not null,
  memo text default '',
  km numeric(7,1),
  created_at timestamptz default now()
);

-- map_pins
create table if not exists map_pins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  label text not null,
  avg_rate integer default 0,
  type text default 'area',
  note text default '',
  created_at timestamptz default now()
);

-- posts（情報共有）
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  type text not null,
  lat numeric(10,7),
  lng numeric(10,7),
  target_name text default '',
  status text default 'pending',
  created_at timestamptz default now()
);

-- announcements（お知らせ）
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS有効化
alter table profiles      enable row level security;
alter table records       enable row level security;
alter table expenses      enable row level security;
alter table map_pins      enable row level security;
alter table posts         enable row level security;
alter table announcements enable row level security;

-- ポリシー
create policy "own_profile"     on profiles      for all using (auth.uid() = id);
create policy "own_records"     on records       for all using (auth.uid() = user_id);
create policy "own_expenses"    on expenses      for all using (auth.uid() = user_id);
create policy "own_pins"        on map_pins      for all using (auth.uid() = user_id);
create policy "read_approved"   on posts         for select using (status = 'approved');
create policy "insert_post"     on posts         for insert with check (auth.uid() = user_id);
create policy "own_post"        on posts         for all using (auth.uid() = user_id);
create policy "admin_posts"     on posts         for all using (exists(select 1 from profiles where id=auth.uid() and role='admin'));
create policy "read_announce"   on announcements for select using (is_active = true);
create policy "admin_announce"  on announcements for all using (exists(select 1 from profiles where id=auth.uid() and role='admin'));

-- 新規ユーザー登録時にprofilesを自動作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'ライダー'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- サンプルお知らせ
insert into announcements (title, content, is_active) values
  ('DELIMANEへようこそ！', 'デリバリー配達員向け収支管理アプリDELIMANEへようこそ。タイマーで稼働時間を記録して収益を管理しましょう！', true),
  ('確定申告の時期です', '確定申告は毎年2月16日〜3月15日です。経費の記録を今から始めておきましょう！', true);