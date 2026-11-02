-- ==============================================================================
-- Perfect Time 🌷 — Our Garden Supabase Database Schema with Row Level Security (RLS)
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Letters in the Garden (Notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT,
  body TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Note visibility: Author sees all their notes (private & shared).
-- Recipient sees notes only when is_shared is TRUE.
CREATE POLICY "Notes select policy"
  ON public.notes FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR (is_shared = true AND (recipient_id = auth.uid() OR recipient_id IS NULL))
  );

CREATE POLICY "Notes insert policy"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Notes update policy"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Notes delete policy"
  ON public.notes FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- 3. The Sound Garden (Songs)
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  music_url TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'want_to_listen' NOT NULL, -- 'want_to_listen', 'listened', 'recommend_back'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Songs select policy"
  ON public.songs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Songs insert policy"
  ON public.songs FOR INSERT
  TO authenticated
  WITH CHECK (added_by = auth.uid());

CREATE POLICY "Songs update policy"
  ON public.songs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Songs delete policy"
  ON public.songs FOR DELETE
  TO authenticated
  USING (added_by = auth.uid());

-- 4. The Exchange Shelf (Recommendations)
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'music', 'films', 'books', 'food', 'places', 'activities'
  description TEXT,
  link TEXT,
  status TEXT DEFAULT 'to_explore' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recommendations select policy"
  ON public.recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recommendations insert policy"
  ON public.recommendations FOR INSERT
  TO authenticated
  WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "Recommendations update policy"
  ON public.recommendations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Recommendations delete policy"
  ON public.recommendations FOR DELETE
  TO authenticated
  USING (contributor_id = auth.uid());

-- 5. Our Little Archive (Memories)
CREATE TABLE IF NOT EXISTS public.garden_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  description TEXT,
  photo_url TEXT NOT NULL,
  date_taken TEXT,
  is_shared BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.garden_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Garden memories select policy"
  ON public.garden_memories FOR SELECT
  TO authenticated
  USING (
    contributor_id = auth.uid()
    OR is_shared = true
  );

CREATE POLICY "Garden memories insert policy"
  ON public.garden_memories FOR INSERT
  TO authenticated
  WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "Garden memories update policy"
  ON public.garden_memories FOR UPDATE
  TO authenticated
  USING (contributor_id = auth.uid())
  WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "Garden memories delete policy"
  ON public.garden_memories FOR DELETE
  TO authenticated
  USING (contributor_id = auth.uid());

-- 6. Petal Notes (Short Messages)
CREATE TABLE IF NOT EXISTS public.petal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  color TEXT DEFAULT '#f472b6' NOT NULL,
  emoji TEXT DEFAULT '🌸' NOT NULL,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.petal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Petal notes select policy"
  ON public.petal_notes FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR (is_shared = true AND (recipient_id = auth.uid() OR recipient_id IS NULL))
  );

CREATE POLICY "Petal notes insert policy"
  ON public.petal_notes FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Petal notes update policy"
  ON public.petal_notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Petal notes delete policy"
  ON public.petal_notes FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- 7. Our Time (Activity Suggestions & Hangout Planning)
CREATE TABLE IF NOT EXISTS public.hangout_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  proposed_date TEXT,
  status TEXT DEFAULT 'proposed' NOT NULL, -- 'proposed', 'interested', 'confirmed', 'completed', 'declined'
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.hangout_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hangout suggestions select policy"
  ON public.hangout_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hangout suggestions insert policy"
  ON public.hangout_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (suggested_by = auth.uid());

CREATE POLICY "Hangout suggestions update policy"
  ON public.hangout_suggestions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Hangout suggestions delete policy"
  ON public.hangout_suggestions FOR DELETE
  TO authenticated
  USING (suggested_by = auth.uid());

-- 8. Little Questions (Prompt Responses)
CREATE TABLE IF NOT EXISTS public.question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question responses select policy"
  ON public.question_responses FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_shared = true
  );

CREATE POLICY "Question responses insert policy"
  ON public.question_responses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Question responses update policy"
  ON public.question_responses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Question responses delete policy"
  ON public.question_responses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 9. Time Capsule (Messages with Controlled Server Release Date)
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  release_at TIMESTAMPTZ NOT NULL,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- CRITICAL SECURITY RULE: The recipient can NEVER select the row before release_at!
CREATE POLICY "Time capsules select policy"
  ON public.time_capsules FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR (
      is_shared = true
      AND (recipient_id = auth.uid() OR recipient_id IS NULL)
      AND release_at <= now()
    )
  );

CREATE POLICY "Time capsules insert policy"
  ON public.time_capsules FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Time capsules update policy"
  ON public.time_capsules FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Time capsules delete policy"
  ON public.time_capsules FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- 10. Mood Garden (Optional Mood Check-ins)
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_key TEXT NOT NULL,
  mood_label TEXT NOT NULL,
  note TEXT,
  is_shared BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mood entries select policy"
  ON public.mood_entries FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_shared = true
  );

CREATE POLICY "Mood entries insert policy"
  ON public.mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Mood entries update policy"
  ON public.mood_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Mood entries delete policy"
  ON public.mood_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
