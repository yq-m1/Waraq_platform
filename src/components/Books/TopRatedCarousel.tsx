import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import type { Book } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';
import StarRating from './StarRating';

type Props = {
  books: Book[];
  onBookClick: (book: Book) => void;
};

const MEDAL: Array<{ gradient: string; text: string }> = [
  { gradient: 'from-yellow-400 to-amber-300', text: 'text-amber-900' }, // gold
  { gradient: 'from-slate-300 to-slate-200',  text: 'text-slate-700' }, // silver
  { gradient: 'from-orange-600 to-amber-500', text: 'text-white'     }, // bronze
];

function RankedCard({
  book,
  rank,
  eager,
  onClick,
}: {
  book: Book;
  rank: number;
  eager: boolean;
  onClick: (book: Book) => void;
}) {
  const { lang } = useLang();
  const [imgFailed, setImgFailed] = useState(false);
  const title = lang === 'ar' ? book.title_ar : book.title_en;
  const avg   = book.avg_rating ?? 0;
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;

  return (
    <button
      onClick={() => onClick(book)}
      className="group relative bg-white/10 hover:bg-white/[0.14] border border-white/10 hover:border-amber-400/30 rounded-2xl overflow-hidden text-start w-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Cover — aspect-[2/3] reserves height before image loads (no layout shift) */}
      <div className="relative aspect-[2/3] overflow-hidden bg-stone-800">
        {book.cover_url && !imgFailed ? (
          <img
            src={book.cover_url}
            alt={title}
            loading={eager ? 'eager' : 'lazy'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <CoverFallback title={title} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Rank badge */}
        <div
          className={`
            absolute top-2.5 start-2.5
            w-7 h-7 rounded-full flex items-center justify-center
            text-xs font-black shadow-lg ring-1
            ${medal
              ? `bg-gradient-to-br ${medal.gradient} ${medal.text} ring-white/40`
              : 'bg-stone-900/80 text-amber-300 ring-amber-400/30'
            }
          `}
        >
          {rank}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="font-bold text-white/90 text-xs leading-snug line-clamp-2 mb-2 group-hover:text-amber-200 transition-colors"
          style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
        >
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          <StarRating rating={avg} size="sm" />
          <span className="text-xs font-semibold text-amber-300 tabular-nums">
            {avg > 0 ? avg.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </button>
  );
}

function CoverFallback({ title }: { title: string }) {
  const colors = ['#78350f', '#1e3a5f', '#14532d', '#4a1942', '#7f1d1d'] as const;
  const bg = colors[(title.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none" style={{ background: bg }}>
      <span className="text-4xl font-bold text-white/20">{title.charAt(0)}</span>
      <span className="text-white/50 text-xs text-center px-3 leading-snug line-clamp-3" style={{ fontFamily: 'serif' }}>
        {title}
      </span>
    </div>
  );
}

export default function TopRatedCarousel({ books, onBookClick }: Props) {
  const { t, lang } = useLang();
  const isRTL = lang === 'ar';

  const scrollRef  = useRef<HTMLDivElement>(null);
  const autoDir    = useRef<1 | -1>(1);   // 1 = forward, -1 = backward
  const paused     = useRef(false);

  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  // ── Arrow-button state ──────────────────────────────────────────────────
  const updateButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const abs = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    if (isRTL) {
      setCanRight(abs > 5);
      setCanLeft(abs < max - 5);
    } else {
      setCanLeft(abs > 5);
      setCanRight(abs < max - 5);
    }
  }, [isRTL]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateButtons, { passive: true });
    const timer = setTimeout(updateButtons, 200);
    return () => { el.removeEventListener('scroll', updateButtons); clearTimeout(timer); };
  }, [books, updateButtons]);

  // ── Manual scroll ───────────────────────────────────────────────────────
  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.75 * (dir === 'left' ? -1 : 1), behavior: 'smooth' });
  };

  // ── Auto-scroll: one card per tick, bounce at boundaries ───────────────
  // Forward direction for RTL means scrolling LEFT (negative scrollLeft).
  // `autoDir=1` → forward, `autoDir=-1` → backward (bounce back).
  useEffect(() => {
    if (books.length === 0) return;

    const id = setInterval(() => {
      if (paused.current) return;
      const el = scrollRef.current;
      if (!el) return;

      const abs = Math.abs(el.scrollLeft);
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;

      // Switch direction at boundaries
      if (abs >= max - 10) autoDir.current = -1;
      else if (abs <= 10)  autoDir.current =  1;

      // Step = one card width + gap (gap-4 = 16px)
      const card = el.firstElementChild as HTMLElement | null;
      const step = card ? card.offsetWidth + 16 : el.clientWidth / 5;

      el.scrollBy({
        // RTL: forward = leftward (negative left); LTR: forward = rightward (positive left)
        left: (isRTL ? -step : step) * autoDir.current,
        behavior: 'smooth',
      });
    }, 3000);

    return () => clearInterval(id);
  }, [books, isRTL]);

  if (books.length === 0) return null;

  return (
    <section
      className="py-14 relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950"
      dir={t.dir}
    >
      {/* Book-pattern texture */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='42' viewBox='0 0 42 42' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' transform='translate(9 9)'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute -top-10 left-1/3 w-96 h-64 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400/20 border border-amber-400/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: isRTL ? 'serif' : 'Georgia, serif' }}
            >
              {t.sections.top_rated}
            </h2>
            <span className="hidden sm:inline px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/25">
              {isRTL ? `أعلى ${books.length}` : `Top ${books.length}`}
            </span>
          </div>

          {/* Navigation — always dir=ltr so ‹ is left and › is right */}
          <div className="flex items-center gap-2" dir="ltr">
            <button
              onClick={() => scroll('left')}
              disabled={!canLeft}
              aria-label="Scroll left"
              className="w-9 h-9 rounded-full border-2 border-amber-400/35 text-amber-400 flex items-center justify-center hover:bg-amber-400/15 hover:border-amber-400/70 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canRight}
              aria-label="Scroll right"
              className="w-9 h-9 rounded-full border-2 border-amber-400/35 text-amber-400 flex items-center justify-center hover:bg-amber-400/15 hover:border-amber-400/70 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Carousel track ── */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          // Pause auto-scroll while the user interacts with the carousel
          onMouseEnter={() => { paused.current = true; }}
          onMouseLeave={() => { paused.current = false; }}
          onTouchStart={() => { paused.current = true; }}
          onTouchEnd={()   => { paused.current = false; }}
        >
          {books.map((book, i) => (
            <div
              key={book.id}
              // 2 visible on mobile → 3 on sm → 4 on md → 5 on lg
              className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] flex-shrink-0 snap-start"
            >
              {/* First 5 cards load eagerly (visible in initial viewport) */}
              <RankedCard book={book} rank={i + 1} eager={i < 5} onClick={onBookClick} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
