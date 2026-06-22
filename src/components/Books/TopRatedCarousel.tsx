import { useState, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import type { Book } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';
import StarRating from './StarRating';

const CARD_WIDTH = 250; // px
const CARD_GAP   = 12;  // px — must match gap in track style

type Props = {
  books: Book[];
  onBookClick: (book: Book) => void;
};

const MEDAL = [
  { gradient: 'linear-gradient(135deg, #facc15, #fbbf24)', color: '#78350f' },
  { gradient: 'linear-gradient(135deg, #cbd5e1, #e2e8f0)', color: '#475569' },
  { gradient: 'linear-gradient(135deg, #ea580c, #f59e0b)', color: '#ffffff' },
];

// ─── Card ────────────────────────────────────────────────────────────────────
function RankedCard({
  book,
  rank,
  onClick,
}: {
  book: Book;
  rank: number;
  onClick: (b: Book) => void;
}) {
  const { lang } = useLang();
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const title = lang === 'ar' ? book.title_ar : book.title_en;
  const avg   = book.avg_rating ?? 0;
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;

  return (
    <button
      onClick={() => onClick(book)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        background: 'none',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'start',
        padding: 0,
        display: 'block',
        backgroundColor: 'rgba(255,255,255,0.1)',
        transform: hovered ? 'scale(1.07)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', backgroundColor: '#292524' }}>
        {book.cover_url && !imgFailed ? (
          <img
            src={book.cover_url}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <CoverFallback title={title} />
        )}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
          }}
        />
        {/* Rank badge */}
        <div
          style={{
            position: 'absolute', top: 8, left: 8,
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900,
            background: medal ? medal.gradient : 'rgba(12,10,9,0.8)',
            color: medal ? medal.color : '#fcd34d',
            boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          {rank}
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        <h3
          style={{
            fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: 12,
            lineHeight: 1.35, margin: '0 0 8px',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            fontFamily: lang === 'ar' ? 'serif' : 'inherit',
          }}
        >
          {title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StarRating rating={avg} size="sm" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fcd34d', fontVariantNumeric: 'tabular-nums' }}>
            {avg > 0 ? avg.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </button>
  );
}

function CoverFallback({ title }: { title: string }) {
  const palette = ['#78350f', '#1e3a5f', '#14532d', '#4a1942', '#7f1d1d'] as const;
  const bg = palette[(title.charCodeAt(0) || 0) % palette.length];
  return (
    <div
      style={{
        width: '100%', height: '100%', background: bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 8, userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>
        {title.charAt(0)}
      </span>
      <span
        style={{
          color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center',
          padding: '0 12px', lineHeight: 1.4, fontFamily: 'serif',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        }}
      >
        {title}
      </span>
    </div>
  );
}

// ─── Carousel ────────────────────────────────────────────────────────────────
export default function TopRatedCarousel({ books, onBookClick }: Props) {
  const { t, lang } = useLang();
  const isRTL = lang === 'ar';
  const [paused, setPaused] = useState(false);

  // One duplicate is enough for a seamless loop
  const doubled = useMemo(() => [...books, ...books], [books]);

  if (!books.length) return null;

  // Total width of ONE set of cards (including gaps between them)
  const trackWidth = books.length * (CARD_WIDTH + CARD_GAP);

  // Duration: tune speed here (px/s ≈ trackWidth / durationSeconds)
  const durationSeconds = trackWidth / 50;

  const keyframes = `
    @keyframes ticker {
      from { transform: translateX(0); }
      to   { transform: translateX(-${trackWidth}px); }
    }
  `;

  return (
    <section
      className="relative bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950"
      style={{ overflow: 'hidden', paddingTop: '3.5rem', paddingBottom: '5rem' }}
      dir={t.dir}
    >
      <style>{keyframes}</style>

      {/* Texture */}
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.035, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='42' height='42' viewBox='0 0 42 42' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' transform='translate(9 9)'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        style={{
          position: 'absolute', top: -40, left: '33%',
          width: 384, height: 256,
          background: 'rgba(245,158,11,0.08)',
          borderRadius: '50%', filter: 'blur(48px)', pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36, height: 36, borderRadius: '0.75rem',
              background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Trophy style={{ width: 16, height: 16, color: '#fbbf24' }} />
          </div>
          <h2
            className="text-2xl font-bold text-white"
            style={{ fontFamily: isRTL ? 'serif' : 'Georgia, serif' }}
          >
            {t.sections.top_rated}
          </h2>
          <span
            className="hidden sm:inline px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(251,191,36,0.15)', color: '#fcd34d',
              border: '1px solid rgba(251,191,36,0.25)',
            }}
          >
            {isRTL ? `أعلى ${books.length}` : `Top ${books.length}`}
          </span>
        </div>
      </div>

      {/*
        Ticker stage:
        - dir="ltr"          → cards always flow left-to-right
        - overflow: hidden   → clips overflowing doubled cards
        - white-space: nowrap → forces single row
      */}
      <div
        dir="ltr"
        style={{ overflow: 'hidden', whiteSpace: 'nowrap', paddingBottom: 8 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* The animated track */}
        <div
          style={{
            display: 'flex',
            gap: CARD_GAP,
            width: 'max-content',
            animation: `ticker ${durationSeconds}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {doubled.map((book, i) => (
            <div
              key={`${book.id}-${i}`}
              style={{ flexShrink: 0, width: CARD_WIDTH }}
            >
              <RankedCard
                book={book}
                rank={(i % books.length) + 1}
                onClick={onBookClick}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div
        style={{
          pointerEvents: 'none', position: 'absolute', inset: '0 auto 0 0',
          width: 80, background: 'linear-gradient(to right, #1c0a00, transparent)',
        }}
      />
      <div
        style={{
          pointerEvents: 'none', position: 'absolute', inset: '0 0 0 auto',
          width: 80, background: 'linear-gradient(to left, #0c0a09, transparent)',
        }}
      />

      {/* Bottom fade — blends dark section into the stone-50 background below */}
      <div
        style={{
          pointerEvents: 'none', position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 96, background: 'linear-gradient(to bottom, transparent, #fafaf9)',
        }}
      />
    </section>
  );
}
