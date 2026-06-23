import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://yqkntszeyllltepdcvgt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlxa250c3pleWxsbHRlcGRjdmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mjk5OTksImV4cCI6MjA5NzEwNTk5OX0.K-5735l3oRQQY2uzi4MG7zp3YjmclmJLFT1IrOefZqI';

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
