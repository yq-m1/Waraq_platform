import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Loader2, Heart, User2, Tag, Calendar, FileText, Building2, Globe, Layers, ShieldCheck, type LucideIcon } from 'lucide-react';
import { supabase, type Book } from '../lib/supabase';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type { Translations } from '../translations/ar';
import StarRating from '../components/Books/StarRating';
import ReviewSection from '../components/Books/ReviewSection';
import PageFlipReader from '../components/Books/PageFlipReader';

type BookDetailProps = {
  bookId: string;
  onBack: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
};

export default function BookDetail({ bookId, onBack, onOpenAuth }: BookDetailProps) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReader, setShowReader] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Fetch book
  useEffect(() => {
    setCoverFailed(false);
    setBook(null);
    setLoading(true);

    async function fetchBook() {
      const { data } = await supabase
        .from('books')
        .select('*, reviews(rating)')
        .eq('id', bookId)
        .single();

      if (data) {
        const reviews = (data as Book & { reviews?: { rating: number }[] }).reviews ?? [];
        const avg = reviews.length > 0
          ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
          : 0;
        setBook({ ...data, avg_rating: avg, review_count: reviews.length });
      }
      setLoading(false);
    }
    fetchBook();
  }, [bookId]);

  // Track recently viewed
  useEffect(() => {
    if (!user || !bookId) return;

    async function trackRecentlyViewed() {
      const { error } = await supabase.from('recently_viewed').upsert(
        { user_id: user.id, book_id: bookId, viewed_at: new Date().toISOString() },
        { onConflict: 'user_id,book_id' }
      );
      if (error) {
        console.error('Failed to track recently viewed:', error);
      }
    }

    trackRecentlyViewed();
  }, [bookId, user]);

  // Check favorite status
  useEffect(() => {
    if (!user || !bookId) { setIsFavorited(false); return; }
    supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle()
      .then(({ data }) => setIsFavorited(!!data));
  }, [user?.id, bookId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [bookId]);

  async function toggleFavorite() {
    if (!user) { onOpenAuth('login'); return; }
    setFavLoading(true);
    if (isFavorited) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId);
      setIsFavorited(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, book_id: bookId });
      setIsFavorited(true);
    }
    setFavLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
        <BookOpen className="w-12 h-12 text-stone-300" />
        <p className="text-stone-500">{lang === 'ar' ? 'الكتاب غير موجود' : 'Book not found'}</p>
        <button onClick={onBack} className="text-amber-600 hover:text-amber-700 text-sm font-semibold">
          {t.book.back}
        </button>
      </div>
    );
  }

  const title = lang === 'ar' ? book.title_ar : book.title_en;
  const summary = lang === 'ar' ? book.summary_ar : book.summary_en;
  const avgRating = book.avg_rating ?? 0;
  const reviewCount = book.review_count ?? 0;
  const showCover = !!book.cover_url && !coverFailed;

  return (
    <>
      {showReader && book.is_free_to_read && (
        <PageFlipReader
          pages={book.content_pages ?? []}
          title={title}
          coverUrl={showCover ? book.cover_url : null}
          onClose={() => setShowReader(false)}
        />
      )}

      <div className="min-h-screen bg-stone-50">

        {/* ── Hero banner ── */}
        <div className="relative bg-amber-950 overflow-hidden" dir={t.dir}>
          {showCover && (
            <img
              src={book.cover_url!}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-110"
              onError={() => setCoverFailed(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/50 via-amber-950/80 to-amber-950" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back button */}
            <div className="pt-20 pb-8 flex">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-amber-300/70 hover:text-amber-200 transition-colors text-sm"
              >
                {lang === 'ar' ? (
                  <><ArrowRight className="w-4 h-4" />{t.book.back}</>
                ) : (
                  <><ArrowLeft className="w-4 h-4" />{t.book.back}</>
                )}
              </button>
            </div>

            {/* Cover + Info */}
            <div className="flex flex-col sm:flex-row gap-8 items-start pb-12">
              {/* Cover thumbnail */}
              <div className="flex-shrink-0 w-36 sm:w-44 -mt-2">
                <div className="rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 aspect-[2/3]">
                  {showCover ? (
                    <img
                      src={book.cover_url!}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={() => setCoverFailed(true)}
                    />
                  ) : (
                    <CoverFallback title={title} />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-3">
                  {book.is_free_to_read ? (
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
                      {t.book.free_badge}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-white/10 text-amber-200/70 text-xs font-medium rounded-full border border-white/10">
                      {t.book.paid_badge}
                    </span>
                  )}
                </div>

                <h1
                  className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-snug"
                  style={{ fontFamily: lang === 'ar' ? 'serif' : 'Georgia, serif' }}
                >
                  {title}
                </h1>

                <div className="flex items-center gap-3 mb-7">
                  <StarRating rating={avgRating} size="md" />
                  <span className="text-amber-200 font-semibold">
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </span>
                  {reviewCount > 0 && (
                    <span className="text-amber-300/60 text-sm">
                      {t.book.based_on} {reviewCount} {t.book.people}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {book.is_free_to_read && (
                    <button
                      onClick={() => setShowReader(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-900/40"
                    >
                      <BookOpen className="w-4 h-4" />
                      {t.book.read_now}
                    </button>
                  )}

                  {/* Favorite toggle button */}
                  <button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    title={isFavorited ? t.profile.remove_favorite : t.profile.add_favorite}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isFavorited
                        ? 'bg-red-500/20 border-red-400/50 text-red-300 hover:bg-red-500/30'
                        : 'border-white/20 text-amber-200/60 hover:border-red-400/50 hover:text-red-300 hover:bg-red-500/10'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 transition-all duration-200 ${
                        isFavorited ? 'fill-red-400 text-red-400 scale-110' : ''
                      } ${favLoading ? 'animate-pulse' : ''}`}
                    />
                    <span className="text-sm font-medium hidden sm:inline">
                      {isFavorited ? t.profile.remove_favorite : t.profile.add_favorite}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── White content cards ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20" dir={t.dir}>
          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-100 mb-6">
            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-400 rounded-full inline-block" />
              {t.book.summary}
            </h2>
            <p
              className="text-stone-600 leading-8 text-sm sm:text-base"
              style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
              dir={t.dir}
            >
              {summary}
            </p>
          </div>

          {/* Book Details */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-100 mb-6">
            <h2 className="text-lg font-bold text-stone-800 mb-2 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-400 rounded-full inline-block" />
              {t.book.details_heading}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
              <DetailCard
                icon={User2}
                label={t.book.detail_author}
                value={book.author || t.book.not_available}
                isAr={lang === 'ar'}
              />
              <DetailCard
                icon={Tag}
                label={t.book.detail_category}
                value={getGenreLabel(book.genre, lang, t)}
                isAr={lang === 'ar'}
              />
              <DetailCard
                icon={Calendar}
                label={t.book.detail_year}
                value={book.publication_year ? String(book.publication_year) : t.book.not_available}
                isAr={lang === 'ar'}
              />
              <DetailCard
                icon={FileText}
                label={t.book.detail_pages}
                value={book.page_count ? `${book.page_count.toLocaleString()} ${t.book.pages_unit}` : t.book.not_available}
                isAr={lang === 'ar'}
              />
              <DetailCard
                icon={Building2}
                label={t.book.detail_publisher}
                value={book.publisher || t.book.not_available}
                isAr={lang === 'ar'}
              />
              <DetailCard
                icon={Globe}
                label={t.book.detail_language}
                value={book.language || t.book.not_available}
                isAr={lang === 'ar'}
              />
              <DetailCard
                icon={Layers}
                label={t.book.detail_sub_genre}
                value={book.sub_genre || t.book.not_available}
                isAr={lang === 'ar'}
              />
              <DetailCard
                icon={ShieldCheck}
                label={t.book.detail_age_rating}
                value={book.age_rating || t.book.not_available}
                isAr={lang === 'ar'}
              />
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-100">
            <ReviewSection bookId={book.id} onOpenAuth={onOpenAuth} />
          </div>
        </div>

      </div>
    </>
  );
}

function CoverFallback({ title }: { title: string }) {
  const initial = title.charAt(0);
  const colors: [string, string][] = [
    ['#78350f', '#92400e'],
    ['#1e3a5f', '#1e40af'],
    ['#14532d', '#166534'],
    ['#4a1942', '#7e22ce'],
    ['#7f1d1d', '#991b1b'],
  ];
  const [from, to] = colors[(title.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3 select-none"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className="text-5xl font-bold text-white/30">{initial}</span>
      <span className="text-white/70 text-xs text-center px-3 leading-snug font-serif">{title}</span>
    </div>
  );
}

function getGenreLabel(genre: string | null, lang: string, t: Translations): string {
  if (!genre) return t.book.not_available;
  if (genre === 'رواية') return t.book.genre_novel;
  if (genre === 'general') return t.book.genre_general;
  return genre;
}

function DetailCard({
  icon: Icon,
  label,
  value,
  isAr,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  isAr: boolean;
}) {
  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="flex flex-col gap-2 p-4 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-amber-700" />
        </div>
        <p className="text-stone-400 text-xs font-medium truncate">{label}</p>
      </div>
      <p
        className="text-stone-800 text-sm font-semibold leading-snug"
        style={{ fontFamily: isAr ? 'serif' : 'inherit' }}
      >
        {value}
      </p>
    </div>
  );
}
