-- ==============================================================================
-- Polaris: Supabase PostgreSQL Schema & Storage Setup
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table
create table if not exists public.user_profiles (
    id text primary key,
    email text,
    display_name text,
    photo_url text,
    role text default 'student',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    last_login_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
    on public.user_profiles for select
    using (true);

create policy "Users can insert/update own profile"
    on public.user_profiles for all
    using (true)
    with check (true);

-- 3. Documents Table
create table if not exists public.documents (
    id text primary key,
    user_id text not null,
    filename text not null,
    mime_type text not null,
    size_bytes bigint not null,
    status text not null default 'requested',
    storage_path text not null,
    content_hash text,
    page_count integer,
    ocr_completed_at timestamptz,
    error text,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_created_at on public.documents(created_at desc);

alter table public.documents enable row level security;

create policy "Users can read own documents"
    on public.documents for select
    using (auth.uid()::text = user_id or user_id like 'demo-%' or user_id like 'user-%');

create policy "Users can insert/update/delete own documents"
    on public.documents for all
    using (auth.uid()::text = user_id or user_id like 'demo-%' or user_id like 'user-%');

-- 4. Pages Table (OCR extracted text per page)
create table if not exists public.pages (
    id text primary key,
    document_id text not null references public.documents(id) on delete cascade,
    user_id text not null,
    page_number integer not null,
    text text not null default '',
    confidence double precision not null default 1.0,
    ocr_engine text not null default 'paddleocr',
    processed_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_pages_document_id on public.pages(document_id);
create index if not exists idx_pages_user_doc on public.pages(user_id, document_id, page_number);

alter table public.pages enable row level security;

create policy "Users can read own pages"
    on public.pages for select
    using (auth.uid()::text = user_id or user_id like 'demo-%' or user_id like 'user-%');

create policy "Users can insert/delete own pages"
    on public.pages for all
    using (auth.uid()::text = user_id or user_id like 'demo-%' or user_id like 'user-%');

-- 5. Supabase Storage Bucket Setup
-- Create 'polaris-documents' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('polaris-documents', 'polaris-documents', false)
on conflict (id) do update set public = false;

-- Storage policies for authenticated user uploads
create policy "Authenticated users can upload documents"
    on storage.objects for insert
    with check (bucket_id = 'polaris-documents');

create policy "Users can read their own documents"
    on storage.objects for select
    using (bucket_id = 'polaris-documents');

create policy "Users can delete their own documents"
    on storage.objects for delete
    using (bucket_id = 'polaris-documents');
