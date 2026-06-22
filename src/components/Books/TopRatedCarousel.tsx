import { useRef, useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  useAnimationFrame,
} from 'framer-motion';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Book } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';
import StarRating from './StarRating';

// Pixels per second — increase for a faster belt
const SPEED = 48;

type Props = {
  books: Book[];
  onBookClick: (book: Book) => void;
};

const MEDAL = [
  { gradient: 'from-yellow-400 to-amber-300', text: 'text-amber-900' }, // gold
  { gradient: 'from-slate-300 to-slate-200',  text: 'text-slate-700' }, // silver
  { gradient: 'from-orange-600 to-amber-500', text: 'text-white'     }, // bronze
];

// ─── Card ────────────────────────────────────────────────────────────────────
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
    <motion.button
      onClick={() => onClick(book)}
      // Lift the card toward the viewer on hover (works inside preserve-3d track)
      whileHover={{ scale: 1.07, z: 50 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="relative w-full rounded-2xl overflow-hidden bg-white/10 border border-white/10
                 text-start cursor-pointer"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Cover — aspect-[2/3] reserves space before image loads (no CLS) */}
      <div className="relative aspect-[2/3] overflow-hidden bg-stone-800">
        {book.cover_url && !imgFailed ? (
          <img
            src={book.cover_url}
            alt={title}
            loading={eager ? 'eager' : 'lazy'}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <CoverFallback title={title} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Rank badge */}
        <div
          className={[
            'absolute top-2 start-2 w-7 h-7 rounded-full flex items-center justify-center',
            'text-xs font-black shadow-lg ring-1',
            medal
              ? `bg-gradient-to-br ${medal.gradient} ${medal.text} ring-white/40`
              : 'bg-stone-900/80 text-amber-300 ring-amber-400/30',
          ].join(' ')}
        >
          {rank}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="font-bold text-white/90 text-xs leading-snug line-clamp-2 mb-2"
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
    </motion.button>
  );
}

function CoverFallback({ title }: { title: string }) {
  const palette = ['#78350f', '#1e3a5f', '#14532d', '#4a1942', '#7f1d1d'] as const;
  const bg = palette[(title.charCodeAt(0) || 0) % palette.length];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 select-none" style={{ background: bg }}>
      <span className="text-4xl font-bold text-white/20">{title.charAt(0)}</span>
      <span className="text-white/50 text-xs text-center px-3 leading-snug line-clamp-3" style={{ fontFamily: 'serif' }}>
        {title}
      </span>
    </div>
  );
}

// ─── Main carousel ───────────────────────────────────────────────────────────
export default function TopRatedCarousel({ books, onBookClick }: Props) {
  const { t, lang } = useLang();
  const isRTL = lang === 'ar';

  // Triple the list so there is always content on both sides of the reset seam
  const tripled = [...books, ...books, ...books];

  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // offsetLeft of the first card in the SECOND copy — this is the seamless reset point
  const [loopWidth, setLoopWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el || el.children.length < books.length + 1) return;
      const secondCopyStart = el.children[books.length] as HTMLElement;
      setLoopWidth(secondCopyStart.offsetLeft);
    };
    const id = setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(id); window.removeEventListener('resize', measure); };
  }, [books]);

  // ── Infinite linear scroll ────────────────────────────────────────────────
  // Moving rightward by SPEED px/s means x decreases (left shift), cards go right→left.
  useAnimationFrame((_, delta) => {
    if (loopWidth === 0) return;
    let next = x.get() - (delta / 1000) * SPEED;
    // Seamless: once we've scrolled past one full copy, jump back by exactly loopWidth
    if (next <= -loopWidth) next += loopWidth;
    x.set(next);
  });

  // Manual arrow: nudge by one card-width, animation continues from new position
  const nudge = (forward: boolean) => {
    if (loopWidth === 0) return;
    const step = loopWidth / books.length;
    let next = x.get() + (forward ? -step : step);
    if (next <= -loopWidth) next += loopWidth;
    if (next > 0)           next -= loopWidth;
    x.set(next);
  };

  if (books.length === 0) return null;

  return (
    <section
      className="py-14 relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950"
      dir={t.dir}
    >
      {/* Subtle book-pattern texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='42' viewBox='0 0 42 42' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' transform='translate(9 9)'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="pointer-events-none absolute -top-10 left-1/3 w-96 h-64 bg-amber-500/8 rounded-full blur-3xl" />

      {/* ── Header (constrained to max-w) ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
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

          {/* Nav buttons — dir=ltr so ‹ always means "go back" */}
          <div className="flex items-center gap-2" dir="ltr">
            <button
              onClick={() => nudge(false)}
              aria-label="Previous"
              className="w-9 h-9 rounded-full border-2 border-amber-400/35 text-amber-400 flex items-center justify-center hover:bg-amber-400/15 hover:border-amber-400/70 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nudge(true)}
              aria-label="Next"
              className="w-9 h-9 rounded-full border-2 border-amber-400/35 text-amber-400 flex items-center justify-center hover:bg-amber-400/15 hover:border-amber-400/70 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3D ticker stage ── */}
      {/*
        perspective on the container projects 3D depth onto the track.
        rotateX on the track tilts the belt away at the top — classic "3D conveyor" look.
        transformOrigin below center means the pivot is below the cards, so they tilt
        naturally (bottom stays close, top recedes into the distance).
        preserve-3d is propagated to card children so whileHover z-lift works.
      */}
      <div
        dir="ltr"
        className="relative"
        style={{
          perspective: '1100px',
          WebkitPerspective: '1100px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <motion.div
          ref={trackRef}
          className="flex gap-3 will-change-transform"
          style={{
            x,
            rotateX: -7,
            transformOrigin: 'center 170%',
            transformStyle: 'preserve-3d',
          }}
        >
          {tripled.map((book, i) => (
            <div
              key={`${book.id}-${i}`}
              // Widths tuned so 4 cards show on mobile, 5 on desktop
              // w-20=80px  → 375px÷96px ≈ 3.9 ≈ 4 cards  ✓
              // sm:w-36    → 640px÷152px ≈ 4.2 ≈ 4–5      ✓
              // md:w-44    → 768px÷192px = 4.0             ✓
              // lg:w-52    → 1024px÷224px ≈ 4.6 ≈ 5       ✓
              className="flex-shrink-0 w-20 sm:w-36 md:w-44 lg:w-52"
            >
              <RankedCard
                book={book}
                rank={(i % books.length) + 1}
                eager={i < 10}
                onClick={onBookClick}
              />
            </div>
          ))}
        </motion.div>

        {/* Left fade — matches section's left edge colour (amber-950) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28"
          style={{
            background: 'linear-gradient(to right, #1c0a00 0%, transparent 100%)',
          }}
        />
        {/* Right fade — matches section's right edge colour (stone-950) */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28"
          style={{
            background: 'linear-gradient(to left, #0c0a09 0%, transparent 100%)',
          }}
        />
      </div>
    </section>
  );
}
