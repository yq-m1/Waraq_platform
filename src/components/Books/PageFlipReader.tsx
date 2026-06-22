import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

type Props = {
  pages: string[];
  title: string;
  coverUrl?: string | null;
  onClose: () => void;
};

type AnimState = 'idle' | 'exit-left' | 'exit-right' | 'enter-left' | 'enter-right';

export default function PageFlipReader({ pages, title, onClose }: Props) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';

  const [currentPage, setCurrentPage] = useState(0);
  const [animState, setAnimState] = useState<AnimState>('idle');

  const totalPages = pages.length;
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (animState !== 'idle') return;
    if (direction === 'next' && !canGoNext) return;
    if (direction === 'prev' && !canGoPrev) return;

    // Exit animation: page slides out in the given direction
    const exitAnim = direction === 'next' ? 'exit-left' : 'exit-right';
    const enterAnim = direction === 'next' ? 'enter-right' : 'enter-left';

    setAnimState(exitAnim);

    setTimeout(() => {
      setCurrentPage(p => direction === 'next' ? p + 1 : p - 1);
      setAnimState(enterAnim);
      setTimeout(() => setAnimState('idle'), 300);
    }, 280);
  }, [animState, canGoNext, canGoPrev]);

  const goNext = useCallback(() => navigate('next'), [navigate]);
  const goPrev = useCallback(() => navigate('prev'), [navigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') isRTL ? goPrev() : goNext();
      if (e.key === 'ArrowLeft')  isRTL ? goNext() : goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose, isRTL]);

  // CSS transform based on animation state
  const pageStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms ease',
    };
    switch (animState) {
      case 'exit-left':
        return { ...base, transform: 'translateX(-6%) rotateY(8deg)', opacity: 0 };
      case 'exit-right':
        return { ...base, transform: 'translateX(6%) rotateY(-8deg)', opacity: 0 };
      case 'enter-left':
        return { ...base, transform: 'translateX(6%) rotateY(-8deg)', opacity: 0, transition: 'none' };
      case 'enter-right':
        return { ...base, transform: 'translateX(-6%) rotateY(8deg)', opacity: 0, transition: 'none' };
      default:
        return { ...base, transform: 'translateX(0) rotateY(0deg)', opacity: 1 };
    }
  };

  const text = pages[currentPage] ?? '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-stone-700/50 bg-stone-900/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
          <h2
            className="text-amber-100 font-bold text-sm md:text-base truncate"
            style={{ fontFamily: isRTL ? 'serif' : 'Georgia, serif' }}
          >
            {title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-200 transition-colors text-sm shrink-0 ms-4"
        >
          <X className="w-4 h-4" />
          {isRTL ? 'إغلاق' : 'Close'}
        </button>
      </header>

      {/* Page area */}
      <main className="relative flex-1 flex items-center justify-center px-10 md:px-20 py-6 overflow-hidden">
        {/* Left / Prev arrow */}
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          aria-label={isRTL ? 'الصفحة التالية' : 'Previous page'}
          className="absolute left-2 md:left-6 z-20 w-11 h-11 rounded-full bg-amber-700/80 hover:bg-amber-600 text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105 disabled:hover:scale-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Book page card */}
        <div
          className="relative w-full max-w-2xl book-page-texture rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #F8F3E8 0%, #EDE4D3 45%, #E4D8C0 100%)',
            boxShadow: `
              0 20px 60px rgba(0,0,0,0.5),
              0 4px 16px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.6),
              inset 4px 0 12px rgba(139,90,43,0.08)
            `,
            perspective: '1200px',
            minHeight: '60vh',
            maxHeight: '72vh',
          }}
        >
          {/* Left edge shadow (spine side) */}
          <div
            className="absolute top-0 bottom-0 w-8 pointer-events-none z-10"
            style={{
              left: 0,
              background: 'linear-gradient(to right, rgba(100,60,20,0.12), transparent)',
            }}
          />
          {/* Right edge shadow */}
          <div
            className="absolute top-0 bottom-0 w-6 pointer-events-none z-10"
            style={{
              right: 0,
              background: 'linear-gradient(to left, rgba(100,60,20,0.08), transparent)',
            }}
          />

          {/* Animated page content */}
          <div
            className="h-full flex flex-col px-8 md:px-12 py-8 overflow-y-auto"
            style={{ ...pageStyle(), transformStyle: 'preserve-3d' }}
          >
            {/* Page number at top */}
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="w-12 h-px bg-amber-400/40" />
              <span className="text-xs font-medium tracking-widest text-amber-700/50 uppercase px-3">
                {isRTL ? `الصفحة ${currentPage + 1}` : `Page ${currentPage + 1}`}
              </span>
              <div className="w-12 h-px bg-amber-400/40" />
            </div>

            {/* Text content */}
            <div
              className="flex-1"
              dir={isRTL ? 'rtl' : 'ltr'}
              style={{ textAlign: isRTL ? 'right' : 'left' }}
            >
              <p
                className="leading-[2.1] text-base md:text-[1.05rem] whitespace-pre-wrap break-words"
                style={{
                  color: '#2C2416',
                  fontFamily: isRTL ? "'Noto Naskh Arabic', serif" : 'Georgia, serif',
                }}
              >
                {text}
              </p>
            </div>

            {/* Bottom ornament */}
            <div className="flex items-center justify-center gap-2 mt-8 shrink-0">
              <div className="w-8 h-px bg-amber-400/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
              <div className="w-8 h-px bg-amber-400/30" />
            </div>
          </div>
        </div>

        {/* Right / Next arrow */}
        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          aria-label={isRTL ? 'الصفحة السابقة' : 'Next page'}
          className="absolute right-2 md:right-6 z-20 w-11 h-11 rounded-full bg-amber-700/80 hover:bg-amber-600 text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105 disabled:hover:scale-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </main>

      {/* Footer nav bar */}
      <footer className="relative z-10 shrink-0 flex items-center justify-between gap-4 px-4 md:px-8 py-3 border-t border-stone-700/50 bg-stone-900/80 backdrop-blur-sm">
        {/* Prev button */}
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800 hover:bg-amber-800/60 text-stone-300 hover:text-amber-100 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          {isRTL ? 'التالي' : 'Previous'}
        </button>

        {/* Page indicator + dot trail */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-amber-300/80 text-xs font-medium tracking-wide">
            {isRTL
              ? `${currentPage + 1} من ${totalPages}`
              : `${currentPage + 1} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-1" dir="ltr">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === currentPage
                    ? 'w-4 h-2 bg-amber-400'
                    : 'w-2 h-2 bg-stone-600 hover:bg-stone-500'
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800 hover:bg-amber-800/60 text-stone-300 hover:text-amber-100 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isRTL ? 'السابق' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
