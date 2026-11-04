-- ==============================================================================
-- Perfect Time 🌷 — Live Cross-Device Synchronization Schema
-- File: supabase/migrations/20261104_unified_sync_schema.sql
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/oaanqtdalcbozsiiqlge/sql/new
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Seed Solomon & Noella Profiles
INSERT INTO public.profiles (id, username, display_name, avatar_url)
VALUES
  ('user-solomon-uuid', 'solomon', 'Solomon 🌿', '/assets/memories/photo-solomon-avatar.jpg'),
  ('user-noella-uuid', 'noella', 'Noella ✨', '/assets/memories/photo-sun-portrait.jpg')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url;

-- 2. Letters in the Garden (Notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT,
  body TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Petal Notes
CREATE TABLE IF NOT EXISTS public.petal_notes (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  color TEXT DEFAULT '#f472b6' NOT NULL,
  emoji TEXT DEFAULT '🌸' NOT NULL,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Mood Garden
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_key TEXT NOT NULL,
  mood_label TEXT NOT NULL,
  note TEXT,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Our Little Archive (Photos & Memories)
CREATE TABLE IF NOT EXISTS public.garden_memories (
  id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  description TEXT,
  photo_url TEXT NOT NULL,
  date_taken TEXT,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Sound Garden (Songs & Audio)
CREATE TABLE IF NOT EXISTS public.songs (
  id TEXT PRIMARY KEY,
  added_by TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  music_url TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'want_to_listen' NOT NULL,
  is_shared BOOLEAN DEFAULT true NOT NULL,
  cover_url TEXT,
  reaction TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Exchange Shelf
CREATE TABLE IF NOT EXISTS public.recommendations (
  id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  link TEXT,
  status TEXT DEFAULT 'to_explore' NOT NULL,
  is_shared BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Our Time (Hangout Suggestions)
CREATE TABLE IF NOT EXISTS public.hangout_suggestions (
  id TEXT PRIMARY KEY,
  suggested_by TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  idea TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'proposed' NOT NULL,
  is_shared BOOLEAN DEFAULT true NOT NULL,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Little Questions
CREATE TABLE IF NOT EXISTS public.question_responses (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Time Capsule
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  unlock_date TIMESTAMPTZ NOT NULL,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- Enable Row Level Security (RLS) on all tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hangout_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- Clean, Permissive Security Policies for the Garden Sanctuary
-- (Allows Solomon and Noella to read/write/share their entries seamlessly)
-- ==============================================================================
DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
CREATE POLICY "allow_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_notes" ON public.notes;
CREATE POLICY "allow_all_notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_petal_notes" ON public.petal_notes;
CREATE POLICY "allow_all_petal_notes" ON public.petal_notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_moods" ON public.mood_entries;
CREATE POLICY "allow_all_moods" ON public.mood_entries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_memories" ON public.garden_memories;
CREATE POLICY "allow_all_memories" ON public.garden_memories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_songs" ON public.songs;
CREATE POLICY "allow_all_songs" ON public.songs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_recommendations" ON public.recommendations;
CREATE POLICY "allow_all_recommendations" ON public.recommendations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_hangouts" ON public.hangout_suggestions;
CREATE POLICY "allow_all_hangouts" ON public.hangout_suggestions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_questions" ON public.question_responses;
CREATE POLICY "allow_all_questions" ON public.question_responses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_capsules" ON public.time_capsules;
CREATE POLICY "allow_all_capsules" ON public.time_capsules FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Storage Bucket for Photo Uploads
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('garden_media', 'garden_media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "allow_public_storage_select" ON storage.objects;
CREATE POLICY "allow_public_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'garden_media');

DROP POLICY IF EXISTS "allow_public_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'garden_media');
