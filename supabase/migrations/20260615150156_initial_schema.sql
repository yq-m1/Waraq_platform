
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_profiles_auth" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_profiles_anon" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  summary_ar TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  cover_url TEXT,
  content_pages TEXT[],
  is_free_to_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_books_auth" ON books FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_books_anon" ON books FOR SELECT TO anon USING (true);
CREATE POLICY "insert_books" ON books FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_books" ON books FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_books" ON books FOR DELETE TO authenticated USING (true);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_reviews_auth" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_reviews_anon" ON reviews FOR SELECT TO anon USING (true);
CREATE POLICY "insert_own_review" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_review" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_review" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
