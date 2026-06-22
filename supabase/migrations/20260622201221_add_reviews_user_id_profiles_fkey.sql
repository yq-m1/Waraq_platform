-- reviews.user_id already references auth.users(id).
-- PostgREST needs a FK to profiles(id) to resolve the
-- embedded `profiles(username)` join in the reviews query.
ALTER TABLE reviews
  ADD CONSTRAINT reviews_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
