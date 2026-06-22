import { useState } from 'react';
import { Lock, BookOpen } from 'lucide-react';
import StarRating from './StarRating';
import type { Book } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';

type BookCardProps = {
  book: Book;
  onClick: (book: Book) => void;
};

export default function BookCard({ book, onClick }: BookCardProps) {
  const { t, lang } = useLang();
  const [imgFailed, setImgFailed] = useState(false);

  const title = lang === 'ar' ? book.title_ar : book.title_en;
  const avgRating = book.avg_rating ?? 0;
  const reviewCount = book.review_count ?? 0;
  const showImage = !!book.cover_url && !imgFailed;

  return (
    <button
      onClick={() => onClick(book)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-stone-100 text-start w-full"
    >
      {/* Cover */}
      <div className="relative overflow-hidden aspect-[2/3]">
        {showImage ? (
          <img
            src={book.cover_url!}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <CoverFallback title={title} />
        )}

        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge */}
        <div className={`absolute top-3 ${lang === 'ar' ? 'right-3' : 'left-3'}`}>
          {book.is_free_to_read ? (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow">
              <BookOpen className="w-3 h-3" />
              {t.book.free_badge}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-stone-700/80 text-stone-200 text-xs font-medium rounded-full">
              <Lock className="w-3 h-3" />
              {t.book.paid_badge}
            </span>
          )}
        </div>

        {/* Read Now on hover */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="bg-amber-400 text-amber-950 text-xs font-bold py-2 rounded-lg text-center">
            {book.is_free_to_read ? t.book.read_now : t.book.preview}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-stone-800 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-amber-700 transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={avgRating} size="sm" />
          <span className="text-xs text-stone-400">
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </span>
          {reviewCount > 0 && (
            <span className="text-xs text-stone-400">({reviewCount})</span>
          )}
        </div>
      </div>
    </button>
  );
}

function CoverFallback({ title }: { title: string }) {
  const initial = title.charAt(0);
  const colors = [
    ['#78350f', '#92400e'],
    ['#1e3a5f', '#1e40af'],
    ['#14532d', '#166534'],
    ['#4a1942', '#7e22ce'],
    ['#7f1d1d', '#991b1b'],
  ];
  const idx = (title.charCodeAt(0) || 0) % colors.length;
  const [from, to] = colors[idx];

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-3 select-none"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <span className="text-5xl font-bold text-white/30">{initial}</span>
      <span
        className="text-white/70 text-xs text-center px-3 leading-snug"
        style={{ fontFamily: 'serif', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {title}
      </span>
    </div>
  );
}
