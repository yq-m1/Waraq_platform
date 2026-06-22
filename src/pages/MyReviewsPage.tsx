import { useState, useEffect } from 'react';
import { Star, Loader2, ArrowLeft, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import StarRating from '../components/Books/StarRating';

type ReviewWithBook = {
  id: string;
  book_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  books: {
    id: string;
    title_ar: string;
    title_en: string;
    cover_url: string | null;
  } | null;
};

type Props = {
  onBack: () => void;
  onBookClick: (bookId: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
};

export default function MyReviewsPage({ onBack, onBookClick, onOpenAuth }: Props) {
  const { t, lang } = useLang();
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetchMyReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('id, book_id, rating, comment, created_at, books(id, title_ar, title_en, cover_url)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (data) setReviews(data as ReviewWithBook[]);
      setLoading(false);
    }

    fetchMyReviews();
  }, [user]);

  const displayName = profile?.username || user?.email?.split('@')[0] || '';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-amber-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/40 to-amber-950" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" dir={t.dir}>
          <div className="pt-20 pb-10">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-amber-300/70 hover:text-amber-200 transition-colors text-sm mb-6"
            >
              {lang === 'ar'
                ? <><ArrowRight className="w-4 h-4" />{t.book.back}</>
                : <><ArrowLeft className="w-4 h-4" />{t.book.back}</>}
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-400/20 border border-amber-400/20 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.profile.my_reviews}</h1>
                {!loading && user && (
                  <p className="text-amber-300/50 text-sm mt-0.5">
                    {reviews.length} {lang === 'ar' ? t.profile.reviews_count : t.profile.reviews_count}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        {!user ? (
          <LoginPrompt onOpenAuth={onOpenAuth} message={t.profile.login_required} />
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState message={t.profile.no_reviews} />
        ) : (
          <div className="space-y-4">
            {reviews.map(review => {
              const book = review.books;
              const title = book ? (lang === 'ar' ? book.title_ar : book.title_en) : '';
              return (
                <div
                  key={review.id}
                  className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Book cover thumbnail */}
                    {book && (
                      <button
                        onClick={() => onBookClick(book.id)}
                        className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden shadow border border-stone-100 hover:opacity-80 transition-opacity"
                      >
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={title} className="w-full h-full object-cover" />
                        ) : (
                          <CoverFallback title={title} />
                        )}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Book title */}
                      {book && (
                        <button
                          onClick={() => onBookClick(book.id)}
                          className="text-sm font-bold text-stone-800 hover:text-amber-700 transition-colors text-start leading-snug mb-2 line-clamp-2"
                          dir={t.dir}
                        >
                          {title}
                        </button>
                      )}

                      {/* Rating + date */}
                      <div className="flex items-center gap-3 mb-3">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-stone-400">
                          {new Date(review.created_at).toLocaleDateString(
                            lang === 'ar' ? 'ar-SA' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-sm text-stone-600 leading-relaxed" dir={t.dir}>
                          {review.comment}
                        </p>
                      )}

                      {/* Author tag */}
                      <div className="flex items-center gap-1.5 mt-3">
                        <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-amber-600" />
                        </div>
                        <span className="text-xs text-stone-400">{displayName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
        <Star className="w-8 h-8 text-stone-300" />
      </div>
      <p className="text-stone-400 text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

function CoverFallback({ title }: { title: string }) {
  const colors = ['#78350f', '#1e3a5f', '#14532d', '#7f1d1d'];
  const bg = colors[(title.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: bg }}>
      <span className="text-white/40 text-xl font-bold">{title.charAt(0)}</span>
    </div>
  );
}

function LoginPrompt({ onOpenAuth, message }: { onOpenAuth: (mode: 'login' | 'signup') => void; message: string }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <p className="text-stone-500 text-sm text-center">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={() => onOpenAuth('login')}
          className="px-5 py-2 border border-amber-400 text-amber-600 text-sm font-semibold rounded-full hover:bg-amber-50 transition-colors"
        >
          {t.auth.login}
        </button>
        <button
          onClick={() => onOpenAuth('signup')}
          className="px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-full hover:bg-amber-400 transition-colors"
        >
          {t.auth.signup}
        </button>
      </div>
    </div>
  );
}
