import { useEffect, useState } from 'react';
import { BookOpen, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import BookCard from '../components/Books/BookCard';
import { useLang } from '../contexts/LanguageContext';

type Props = {
  onBack: () => void;
  onBookClick: (book: Book) => void;
};

export default function FreeBooksPage({ onBack, onBookClick }: Props) {
  const { t, lang } = useLang();
  const isRTL = lang === 'ar';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFreeBooks() {
      const { data } = await supabase
        .from('books')
        .select('*, reviews(rating)')
        .eq('is_free_to_read', true)
        .order('title_ar');

      if (data) {
        const mapped: Book[] = data.map((b: Book & { reviews?: { rating: number }[] }) => {
          const reviews = b.reviews ?? [];
          const avg = reviews.length > 0
            ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
            : 0;
          return { ...b, avg_rating: avg, review_count: reviews.length };
        });
        setBooks(mapped);
      }
      setLoading(false);
    }
    fetchFreeBooks();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50" dir={t.dir}>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='42' viewBox='0 0 42 42' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' transform='translate(9 9)'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-amber-300/70 hover:text-amber-300 transition-colors mb-8 group"
          >
            <BackArrow className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium">
              {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
            </span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-400/20 border border-amber-400/30 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 text-xs font-medium">
                  {isRTL ? 'متاح مجاناً' : 'Free to Read'}
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold text-white mb-2"
                style={{ fontFamily: isRTL ? 'serif' : 'Georgia, serif' }}
              >
                {isRTL ? 'الكتب المجانية' : 'Free Books'}
              </h1>
              <p className="text-amber-200/60 text-sm sm:text-base">
                {isRTL
                  ? 'اقرأ هذه الكتب كاملةً مجاناً — لا حساب مطلوب'
                  : 'Read these books for free — no account required'}
              </p>
            </div>

            {!loading && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl self-start sm:self-auto">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold text-lg">{books.length}</span>
                <span className="text-amber-200/70 text-sm">{isRTL ? 'كتاب' : 'books'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-stone-50 to-transparent" />
      </div>

      {/* Books grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100 animate-pulse">
                <div className="aspect-[2/3] bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p style={{ fontFamily: isRTL ? 'serif' : 'inherit' }}>
              {isRTL ? 'لا توجد كتب مجانية حالياً' : 'No free books available yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {books.map(book => (
                <BookCard key={book.id} book={book} onClick={onBookClick} />
              ))}
            </div>
            <p className="text-center text-stone-400 text-sm mt-10 flex items-center justify-center gap-2">
              <span className="inline-block w-10 h-px bg-stone-300" />
              {isRTL
                ? `تم عرض جميع الكتب المجانية الـ ${books.length}`
                : `All ${books.length} free books shown`}
              <span className="inline-block w-10 h-px bg-stone-300" />
            </p>
          </>
        )}
      </div>
    </div>
  );
}
