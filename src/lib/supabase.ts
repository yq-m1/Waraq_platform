import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export type Book = {
  id: string;
  title_ar: string;
  title_en: string;
  summary_ar: string;
  summary_en: string;
  cover_url: string | null;
  content_pages: string[] | null;
  is_free_to_read: boolean;
  genre: string | null;
  author: string | null;
  publisher: string | null;
  publication_year: number | null;
  page_count: number | null;
  language: string | null;
  sub_genre: string | null;
  age_rating: string | null;
  created_at: string;
  avg_rating?: number;
  review_count?: number;
  latest_review_at?: string | null;
};

export type Review = {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { username: string };
  books?: Pick<Book, 'id' | 'title_ar' | 'title_en' | 'cover_url'>;
};

export type Favorite = {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  books?: Book;
};

export type RecentlyViewed = {
  id: string;
  user_id: string;
  book_id: string;
  viewed_at: string;
  books?: Book;
};
