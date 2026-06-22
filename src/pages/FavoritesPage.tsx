import { useState, useEffect } from 'react';
import { Heart, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import BookCard from '../components/Books/BookCard';

type Props = {
  onBack: () => void;
  onBookClick: (book: Book) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
};

export default function FavoritesPage({ onBack, onBookClick, onOpenAuth }: Props) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function fetchFavorites() {
      const { data } = await supabase
        .from('favorites')
        .select('books(*, reviews(rating))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (data) {
        const mapped = data
          .map((row: any) => row.books)
          .filter(Boolean)
          .map((book: any) => {
            const reviews = book.reviews ?? [];
            const avg = reviews.length > 0
              ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
              : 0;
            return { ...book, avg_rating: avg, review_count: reviews.length };
          });
        setBooks(mapped);
      }
      setLoading(false);
    }

    fetchFavorites();
  }, [user]);

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
              <div className="w-12 h-12 bg-red-500/20 border border-red-400/20 rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.profile.favorites}</h1>
                {!loading && (
                  <p className="text-amber-300/50 text-sm mt-0.5">
                    {books.length} {lang === 'ar' ? t.profile.books_count_ar : t.profile.books_count_en}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        {!user ? (
          <LoginPrompt onOpenAuth={onOpenAuth} message={t.profile.login_required} />
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <EmptyState icon={Heart} message={t.profile.no_favorites} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} onClick={onBookClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-stone-300" />
      </div>
      <p className="text-stone-400 text-sm text-center max-w-xs">{message}</p>
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
