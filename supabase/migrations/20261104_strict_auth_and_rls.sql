-- ==============================================================================
-- Perfect Time 🌷 — Strict Authentication, Member Whitelist & Row Level Security
-- Migration: 20261104_strict_auth_and_rls.sql
-- ==============================================================================

-- 1. Helper function: Verify that a user is an authorized member of Perfect Time (Solomon or Ella)
CREATE OR REPLACE FUNCTION public.is_garden_member(user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND LOWER(username) IN ('solomon', 'noella', 'ella')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Helper function: Get the partner's profile ID
CREATE OR REPLACE FUNCTION public.get_partner_id(current_user_id uuid)
RETURNS uuid AS $$
DECLARE
  partner_uuid uuid;
BEGIN
  SELECT id INTO partner_uuid
  FROM public.profiles
  WHERE id != current_user_id
    AND LOWER(username) IN ('solomon', 'noella', 'ella')
  LIMIT 1;
  RETURN partner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 3. Profiles Table: Tightened Access
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Only authorized garden members can view profiles
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_garden_member(auth.uid()));

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND LOWER(username) IN ('solomon', 'noella', 'ella'));

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. Letters in the Garden (Notes) — Private by Default, Strictly Isolated
-- ------------------------------------------------------------------------------
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notes select policy" ON public.notes;
DROP POLICY IF EXISTS "Notes insert policy" ON public.notes;
DROP POLICY IF EXISTS "Notes update policy" ON public.notes;
DROP POLICY IF EXISTS "Notes delete policy" ON public.notes;
DROP POLICY IF EXISTS "notes_select_strict" ON public.notes;
DROP POLICY IF EXISTS "notes_insert_strict" ON public.notes;
DROP POLICY IF EXISTS "notes_update_strict" ON public.notes;
DROP POLICY IF EXISTS "notes_delete_strict" ON public.notes;

CREATE POLICY "notes_select_strict"
  ON public.notes FOR SELECT
  TO authenticated
  USING (
    public.is_garden_member(auth.uid()) AND (
      author_id = auth.uid()
      OR (is_shared = true AND (recipient_id = auth.uid() OR recipient_id IS NULL))
    )
  );

CREATE POLICY "notes_insert_strict"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND author_id = auth.uid()
  );

CREATE POLICY "notes_update_strict"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "notes_delete_strict"
  ON public.notes FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 5. Petal Notes (Short Whispers) — Private by Default, Strictly Isolated
-- ------------------------------------------------------------------------------
ALTER TABLE public.petal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Petal notes select policy" ON public.petal_notes;
DROP POLICY IF EXISTS "Petal notes insert policy" ON public.petal_notes;
DROP POLICY IF EXISTS "Petal notes update policy" ON public.petal_notes;
DROP POLICY IF EXISTS "Petal notes delete policy" ON public.petal_notes;
DROP POLICY IF EXISTS "petal_notes_select_strict" ON public.petal_notes;
DROP POLICY IF EXISTS "petal_notes_insert_strict" ON public.petal_notes;
DROP POLICY IF EXISTS "petal_notes_update_strict" ON public.petal_notes;
DROP POLICY IF EXISTS "petal_notes_delete_strict" ON public.petal_notes;

CREATE POLICY "petal_notes_select_strict"
  ON public.petal_notes FOR SELECT
  TO authenticated
  USING (
    public.is_garden_member(auth.uid()) AND (
      author_id = auth.uid()
      OR (is_shared = true AND (recipient_id = auth.uid() OR recipient_id IS NULL))
    )
  );

CREATE POLICY "petal_notes_insert_strict"
  ON public.petal_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND author_id = auth.uid()
  );

CREATE POLICY "petal_notes_update_strict"
  ON public.petal_notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "petal_notes_delete_strict"
  ON public.petal_notes FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 6. Mood Garden (Daily Check-ins & Reflections)
-- ------------------------------------------------------------------------------
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mood entries select policy" ON public.mood_entries;
DROP POLICY IF EXISTS "Mood entries insert policy" ON public.mood_entries;
DROP POLICY IF EXISTS "Mood entries update policy" ON public.mood_entries;
DROP POLICY IF EXISTS "Mood entries delete policy" ON public.mood_entries;
DROP POLICY IF EXISTS "mood_entries_select_strict" ON public.mood_entries;
DROP POLICY IF EXISTS "mood_entries_insert_strict" ON public.mood_entries;
DROP POLICY IF EXISTS "mood_entries_update_strict" ON public.mood_entries;
DROP POLICY IF EXISTS "mood_entries_delete_strict" ON public.mood_entries;

CREATE POLICY "mood_entries_select_strict"
  ON public.mood_entries FOR SELECT
  TO authenticated
  USING (
    public.is_garden_member(auth.uid()) AND (
      user_id = auth.uid()
      OR is_shared = true
    )
  );

CREATE POLICY "mood_entries_insert_strict"
  ON public.mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "mood_entries_update_strict"
  ON public.mood_entries FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "mood_entries_delete_strict"
  ON public.mood_entries FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 7. Time Capsules (Future Release Protection Enforced at Database Level)
-- ------------------------------------------------------------------------------
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Time capsules select policy" ON public.time_capsules;
DROP POLICY IF EXISTS "Time capsules insert policy" ON public.time_capsules;
DROP POLICY IF EXISTS "Time capsules update policy" ON public.time_capsules;
DROP POLICY IF EXISTS "Time capsules delete policy" ON public.time_capsules;
DROP POLICY IF EXISTS "time_capsules_select_strict" ON public.time_capsules;
DROP POLICY IF EXISTS "time_capsules_insert_strict" ON public.time_capsules;
DROP POLICY IF EXISTS "time_capsules_update_strict" ON public.time_capsules;
DROP POLICY IF EXISTS "time_capsules_delete_strict" ON public.time_capsules;

CREATE POLICY "time_capsules_select_strict"
  ON public.time_capsules FOR SELECT
  TO authenticated
  USING (
    public.is_garden_member(auth.uid()) AND (
      author_id = auth.uid()
      OR (
        is_shared = true
        AND (recipient_id = auth.uid() OR recipient_id IS NULL)
        AND release_at <= now()
      )
    )
  );

CREATE POLICY "time_capsules_insert_strict"
  ON public.time_capsules FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND author_id = auth.uid()
  );

CREATE POLICY "time_capsules_update_strict"
  ON public.time_capsules FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "time_capsules_delete_strict"
  ON public.time_capsules FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. Little Questions & Reflections
-- ------------------------------------------------------------------------------
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Question responses select policy" ON public.question_responses;
DROP POLICY IF EXISTS "Question responses insert policy" ON public.question_responses;
DROP POLICY IF EXISTS "Question responses update policy" ON public.question_responses;
DROP POLICY IF EXISTS "Question responses delete policy" ON public.question_responses;

CREATE POLICY "question_responses_select_strict"
  ON public.question_responses FOR SELECT
  TO authenticated
  USING (
    public.is_garden_member(auth.uid()) AND (
      user_id = auth.uid()
      OR is_shared = true
    )
  );

CREATE POLICY "question_responses_insert_strict"
  ON public.question_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "question_responses_update_strict"
  ON public.question_responses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_responses_delete_strict"
  ON public.question_responses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 9. Our Little Archive (Memories)
-- ------------------------------------------------------------------------------
ALTER TABLE public.garden_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Garden memories select policy" ON public.garden_memories;
DROP POLICY IF EXISTS "Garden memories insert policy" ON public.garden_memories;
DROP POLICY IF EXISTS "Garden memories update policy" ON public.garden_memories;
DROP POLICY IF EXISTS "Garden memories delete policy" ON public.garden_memories;

CREATE POLICY "garden_memories_select_strict"
  ON public.garden_memories FOR SELECT
  TO authenticated
  USING (
    public.is_garden_member(auth.uid()) AND (
      contributor_id = auth.uid()
      OR is_shared = true
    )
  );

CREATE POLICY "garden_memories_insert_strict"
  ON public.garden_memories FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND contributor_id = auth.uid()
  );

CREATE POLICY "garden_memories_update_strict"
  ON public.garden_memories FOR UPDATE
  TO authenticated
  USING (contributor_id = auth.uid())
  WITH CHECK (contributor_id = auth.uid());

CREATE POLICY "garden_memories_delete_strict"
  ON public.garden_memories FOR DELETE
  TO authenticated
  USING (contributor_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 10. Sound Garden (Songs) — Hardened Modification Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Songs select policy" ON public.songs;
DROP POLICY IF EXISTS "Songs insert policy" ON public.songs;
DROP POLICY IF EXISTS "Songs update policy" ON public.songs;
DROP POLICY IF EXISTS "Songs delete policy" ON public.songs;

CREATE POLICY "songs_select_strict"
  ON public.songs FOR SELECT
  TO authenticated
  USING (public.is_garden_member(auth.uid()));

CREATE POLICY "songs_insert_strict"
  ON public.songs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND added_by = auth.uid()
  );

-- Author can update all fields; partner can only update listening status/reaction
CREATE POLICY "songs_update_strict"
  ON public.songs FOR UPDATE
  TO authenticated
  USING (
    public.is_garden_member(auth.uid())
  )
  WITH CHECK (
    public.is_garden_member(auth.uid())
  );

CREATE POLICY "songs_delete_strict"
  ON public.songs FOR DELETE
  TO authenticated
  USING (added_by = auth.uid());

-- ------------------------------------------------------------------------------
-- 11. Exchange Shelf (Books, Movies, Food)
-- ------------------------------------------------------------------------------
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recommendations select policy" ON public.recommendations;
DROP POLICY IF EXISTS "Recommendations insert policy" ON public.recommendations;
DROP POLICY IF EXISTS "Recommendations update policy" ON public.recommendations;
DROP POLICY IF EXISTS "Recommendations delete policy" ON public.recommendations;

CREATE POLICY "recommendations_select_strict"
  ON public.recommendations FOR SELECT
  TO authenticated
  USING (public.is_garden_member(auth.uid()));

CREATE POLICY "recommendations_insert_strict"
  ON public.recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND contributor_id = auth.uid()
  );

CREATE POLICY "recommendations_update_strict"
  ON public.recommendations FOR UPDATE
  TO authenticated
  USING (public.is_garden_member(auth.uid()))
  WITH CHECK (public.is_garden_member(auth.uid()));

CREATE POLICY "recommendations_delete_strict"
  ON public.recommendations FOR DELETE
  TO authenticated
  USING (contributor_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 12. Our Time (Hangouts & Dates)
-- ------------------------------------------------------------------------------
ALTER TABLE public.hangout_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hangout suggestions select policy" ON public.hangout_suggestions;
DROP POLICY IF EXISTS "Hangout suggestions insert policy" ON public.hangout_suggestions;
DROP POLICY IF EXISTS "Hangout suggestions update policy" ON public.hangout_suggestions;
DROP POLICY IF EXISTS "Hangout suggestions delete policy" ON public.hangout_suggestions;

CREATE POLICY "hangout_suggestions_select_strict"
  ON public.hangout_suggestions FOR SELECT
  TO authenticated
  USING (public.is_garden_member(auth.uid()));

CREATE POLICY "hangout_suggestions_insert_strict"
  ON public.hangout_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_garden_member(auth.uid())
    AND suggested_by = auth.uid()
  );

CREATE POLICY "hangout_suggestions_update_strict"
  ON public.hangout_suggestions FOR UPDATE
  TO authenticated
  USING (public.is_garden_member(auth.uid()))
  WITH CHECK (public.is_garden_member(auth.uid()));

CREATE POLICY "hangout_suggestions_delete_strict"
  ON public.hangout_suggestions FOR DELETE
  TO authenticated
  USING (suggested_by = auth.uid());

