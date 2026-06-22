import { useEffect, useState } from 'react';
import { BookOpen, Sparkles, ArrowDown, ChevronDown, Loader2, Heart } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import BookCard from '../components/Books/BookCard';
import FreeBookCarousel from '../components/Books/FreeBookCarousel';

const PAGE_SIZE = 8;

type FilterKey = 'all' | 'most-read' | 'novels' | 'recent-reviews';

type HomeProps = {
  searchQuery: string;
  onBookClick: (book: Book) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onNavigate?: (page: string) => void;
};

export default function Home({ searchQuery, onBookClick, onOpenAuth, onNavigate }: HomeProps) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function fetchBooks() {
      const { data } = await supabase
        .from('books')
        .select('*, reviews(rating, created_at)')
        .order('created_at', { ascending: false });

      if (data) {
        const withStats: Book[] = data.map((book: Book & { reviews?: { rating: number; created_at: string }[] }) => {
          const reviews = book.reviews ?? [];
          const avg = reviews.length > 0
            ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
            : 0;
          const latest = reviews.length > 0
            ? reviews.reduce((best, r) => r.created_at > best ? r.created_at : best, reviews[0].created_at)
            : null;
          return { ...book, avg_rating: avg, review_count: reviews.length, latest_review_at: latest };
        });
        setBooks(withStats);
      }
      setLoading(false);
    }
    fetchBooks();
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter]);

  const searchFiltered = searchQuery
    ? books.filter(b =>
        b.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.title_en.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : books;

  const freeBooks = books.filter(b => b.is_free_to_read);

  function applyFilter(source: Book[]): Book[] {
    switch (activeFilter) {
      case 'most-read':
        return [...source].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0));
      case 'novels':
        return source.filter(b => b.genre === 'novel' || b.genre === 'رواية');
      case 'recent-reviews':
        return [...source]
          .filter(b => b.latest_review_at != null)
          .sort((a, b) => (b.latest_review_at! > a.latest_review_at! ? 1 : -1));
      default:
        return source;
    }
  }

  const allFiltered = applyFilter(books);
  const visibleBooks = allFiltered.slice(0, visibleCount);
  const hasMore = visibleCount < allFiltered.length;

  function handleLoadMore() {
    setLoadingMore(true);
    // Micro-delay so the spinner renders before the DOM update
    setTimeout(() => {
      setVisibleCount(c => c + PAGE_SIZE);
      setLoadingMore(false);
    }, 400);
  }

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: 'all',            label: t.sections.filter_all },
    { key: 'most-read',      label: t.sections.filter_most_read },
    { key: 'novels',         label: t.sections.filter_novels },
    { key: 'recent-reviews', label: t.sections.filter_recent_reviews },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-amber-900">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='42' viewBox='0 0 42 42' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' transform='translate(9 9)'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative text-center px-6 max-w-4xl mx-auto" dir={t.dir}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 border border-amber-400/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">
              {lang === 'ar' ? 'منصة الكتب والمراجعات العربية' : 'Arabic & World Book Platform'}
            </span>
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: lang === 'ar' ? 'serif' : 'Georgia, serif' }}
          >
            {t.hero.title}
          </h1>
          <p className="text-amber-200/70 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#books"
              className="flex items-center gap-2 px-8 py-3.5 bg-amber-400 text-amber-950 font-bold rounded-full hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
            >
              <BookOpen className="w-5 h-5" />
              {t.hero.cta_browse}
            </a>
            {user ? (
              <button
                onClick={() => onNavigate?.('favorites')}
                className="flex items-center gap-2 px-8 py-3.5 border-2 border-amber-400/40 text-amber-300 font-semibold rounded-full hover:border-amber-400 hover:text-amber-200 transition-colors"
              >
                <Heart className="w-4 h-4" />
                {lang === 'ar' ? 'مكتبتي المفضلة' : 'My Library'}
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('signup')}
                className="flex items-center gap-2 px-8 py-3.5 border-2 border-amber-400/40 text-amber-300 font-semibold rounded-full hover:border-amber-400 hover:text-amber-200 transition-colors"
              >
                {lang === 'ar' ? 'انضم إلينا' : 'Join Us'}
              </button>
            )}
          </div>

          <div className="mt-16 flex justify-center animate-bounce opacity-40">
            <ArrowDown className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-stone-50 to-transparent" />
      </section>

      {/* Books Content */}
      <div id="books">
        {searchQuery ? (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-7 bg-amber-400 rounded-full" />
                <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}>
                  {t.sections.search_results}: "{searchQuery}"
                </h2>
              </div>
              {searchFiltered.length === 0 ? (
                <div className="text-center py-20 text-stone-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{t.sections.no_results} "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {searchFiltered.map(book => (
                    <BookCard key={book.id} book={book} onClick={onBookClick} />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Free Books Carousel */}
            {freeBooks.length > 0 && (
              <FreeBookCarousel
                books={freeBooks}
                title={t.sections.free_books}
                onBookClick={onBookClick}
                onViewAll={() => onNavigate?.('free-books')}
              />
            )}

            {/* All Books — with filter tabs + load more */}
            <section className="py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-7 bg-amber-400 rounded-full" />
                  <h2
                    className="text-2xl font-bold text-stone-800"
                    style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
                  >
                    {t.sections.all_books}
                  </h2>
                </div>

                {/* Filter tabs */}
                <div
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  className="flex items-center gap-2 flex-wrap mb-8"
                >
                  {filterTabs.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilter(key)}
                      className={`
                        relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200
                        ${activeFilter === key
                          ? 'bg-amber-900 text-amber-100 shadow-md shadow-amber-900/20'
                          : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-300 hover:text-amber-800 hover:bg-amber-50'
                        }
                      `}
                      style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
                    >
                      {label}
                      {activeFilter === key && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-100 animate-pulse">
                        <div className="aspect-[2/3] bg-stone-200" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-stone-200 rounded w-3/4" />
                          <div className="h-3 bg-stone-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : visibleBooks.length === 0 ? (
                  <div className="text-center py-20 text-stone-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}>
                      {lang === 'ar' ? 'لا توجد كتب في هذه الفئة' : 'No books in this category'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {visibleBooks.map(book => (
                      <BookCard key={book.id} book={book} onClick={onBookClick} />
                    ))}
                  </div>
                )}

                {/* Load More / End indicator */}
                {!loading && allFiltered.length > 0 && (
                  <div className="mt-12 flex flex-col items-center gap-3">
                    {hasMore ? (
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="group flex items-center gap-3 px-8 py-3.5 bg-amber-900 hover:bg-amber-800 disabled:opacity-70 text-amber-100 font-semibold rounded-full transition-all duration-200 shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30 hover:-translate-y-0.5"
                        style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
                      >
                        {loadingMore ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                        )}
                        {t.sections.load_more}
                        {!loadingMore && (
                          <span className="text-amber-400/70 text-xs font-normal">
                            {allFiltered.length - visibleCount}+
                          </span>
                        )}
                      </button>
                    ) : (
                      <p className="text-stone-400 text-sm flex items-center gap-2">
                        <span className="inline-block w-8 h-px bg-stone-300" />
                        {t.sections.all_shown}
                        <span className="inline-block w-8 h-px bg-stone-300" />
                      </p>
                    )}
                    <p className="text-stone-400 text-xs">
                      {lang === 'ar'
                        ? `عرض ${visibleBooks.length} من ${allFiltered.length} كتاب`
                        : `Showing ${visibleBooks.length} of ${allFiltered.length} books`}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
