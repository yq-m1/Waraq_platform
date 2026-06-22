import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

type Props = {
  pages: string[];
  title: string;
  coverUrl?: string | null;
  onClose: () => void;
};

export default function PageFlipReader({ pages, title, coverUrl, onClose }: Props) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';

  // State
  const [leftPage, setLeftPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);

  // Calculate totals
  const hasCover = !!coverUrl;
  const contentPages = pages.length;
  const totalSheets = hasCover ? Math.ceil((contentPages + 1) / 2) + 1 : Math.ceil(contentPages / 2);
  const currentSheet = hasCover ? Math.ceil((leftPage + 2) / 2) : Math.ceil((leftPage + 1) / 2);
  const totalPageNumbers = contentPages + (hasCover ? 1 : 0);
  const currentPageDisplay = hasCover ? leftPage + 1 : leftPage;
  const rightPage = leftPage + 1;

  // Navigation
  const canGoNext = rightPage < contentPages;
  const canGoPrev = leftPage > 0;

  const goNext = useCallback(() => {
    if (!canGoNext || isFlipping) return;
    setFlipDirection('next');
    setIsFlipping(true);
  }, [canGoNext, isFlipping]);

  const goPrev = useCallback(() => {
    if (!canGoPrev || isFlipping) return;
    setFlipDirection('prev');
    setIsFlipping(true);
  }, [canGoPrev, isFlipping]);

  // Handle flip completion
  useEffect(() => {
    if (!isFlipping) return;
    const timer = setTimeout(() => {
      if (flipDirection === 'next') {
        setLeftPage(p => Math.min(p + 2, contentPages - 1));
      } else if (flipDirection === 'prev') {
        setLeftPage(p => Math.max(p - 2, 0));
      }
      setIsFlipping(false);
      setFlipDirection(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [isFlipping, flipDirection, contentPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') isRTL ? goPrev() : goNext();
      if (e.key === 'ArrowLeft') isRTL ? goNext() : goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose, isRTL]);

  // Render page content
  const renderPageContent = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= contentPages) return null;
    const text = pages[pageIndex];
    if (!text) return null;
    return (
      <p className="leading-[2.2] text-base md:text-lg whitespace-pre-wrap break-words font-serif" style={{ color: '#333333' }}>
        {text}
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-stone-700/50 bg-stone-900/80 backdrop-blur-sm">
        <h2 className="text-amber-100 font-bold text-sm md:text-base truncate max-w-[60%]" style={{ fontFamily: isRTL ? 'serif' : 'Georgia, serif' }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-200 transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          {isRTL ? 'إغلاق' : 'Close'}
        </button>
      </header>

      {/* Book spread */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-6 md:px-12">
        {/* Book container with perspective */}
        <div className="relative w-full max-w-4xl aspect-[1.4/1]">
          {/* Book spine shadow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-stone-900/80 via-stone-800/60 to-stone-900/80 z-20 rounded-sm" />

          {/* Left page */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full rounded-l-xl shadow-2xl overflow-hidden border border-amber-200/50 book-page-texture ${
              isFlipping && flipDirection === 'prev'
                ? 'animate-flip-in-left'
                : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              perspective: '2000px',
              background: 'linear-gradient(135deg, #F5F0E6 0%, #EDE4D3 50%, #E8DCC8 100%)',
              boxShadow: 'inset -12px 0 32px rgba(139, 90, 43, 0.12), inset -2px 0 8px rgba(139, 90, 43, 0.08), 0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto">
              {/* Page number top */}
              <div className="text-xs text-amber-700/60 mb-2 text-center font-medium">
                {isRTL ? 'الصفحة' : 'Page'} {leftPage + 1}
              </div>

              {/* Content */}
              <div className="flex-1 text-right" dir="rtl">
                {renderPageContent(leftPage) || (
                  <div className="h-full flex items-center justify-center text-amber-800/40">
                    {isRTL ? 'صفحة فارغة' : 'Blank page'}
                  </div>
                )}
              </div>

              {/* Decorative bottom */}
              <div className="border-t border-amber-300/40 mt-4 pt-2">
                <div className="flex justify-center">
                  <div className="w-12 h-0.5 bg-amber-400/50 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right page */}
          <div
            className={`absolute top-0 right-0 w-1/2 h-full rounded-r-xl shadow-2xl overflow-hidden border border-amber-200/50 book-page-texture ${
              isFlipping && flipDirection === 'next'
                ? 'animate-flip-in-right'
                : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              perspective: '2000px',
              background: 'linear-gradient(225deg, #F5F0E6 0%, #EDE4D3 50%, #E8DCC8 100%)',
              boxShadow: 'inset 12px 0 32px rgba(139, 90, 43, 0.12), inset 2px 0 8px rgba(139, 90, 43, 0.08), 0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto">
              {/* Page number top */}
              <div className="text-xs text-amber-700/60 mb-2 text-center font-medium">
                {isRTL ? 'الصفحة' : 'Page'} {rightPage + 1}
              </div>

              {/* Content */}
              <div className="flex-1 text-right" dir="rtl">
                {renderPageContent(rightPage) || (
                  <div className="h-full flex items-center justify-center text-amber-800/40">
                    {isRTL ? 'نهاية الكتاب' : 'End of book'}
                  </div>
                )}
              </div>

              {/* Decorative bottom */}
              <div className="border-t border-amber-300/40 mt-4 pt-2">
                <div className="flex justify-center">
                  <div className="w-12 h-0.5 bg-amber-400/50 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Page turn overlay animation */}
          {isFlipping && (
            <div
              className={`absolute top-0 ${flipDirection === 'next' ? 'right-0' : 'left-0'} w-1/2 h-full z-30 book-page-texture animate-page-turn-${flipDirection}`}
              style={{
                background: 'linear-gradient(135deg, #F5F0E6 0%, #EDE4D3 100%)',
                transformStyle: 'preserve-3d',
                transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                borderRadius: flipDirection === 'next' ? '0 0.75rem 0.75rem 0' : '0.75rem 0 0 0.75rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              }}
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          className="absolute left-2 md:left-6 w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center disabled:opacity-30 disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          className="absolute right-2 md:right-6 w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center disabled:opacity-30 disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-4 md:px-8 py-3 border-t border-stone-700/50 bg-stone-900/80 backdrop-blur-sm">
        <div className="text-stone-500 text-xs">
          {isRTL
            ? `عرض الصفحات ${leftPage + 1}-${Math.min(rightPage + 1, contentPages)} من ${contentPages}`
            : `Pages ${leftPage + 1}-${Math.min(rightPage + 1, contentPages)} of ${contentPages}`}
        </div>

        {/* Page slider */}
        <input
          type="range"
          min={0}
          max={Math.max(0, contentPages - 1)}
          value={leftPage}
          onChange={(e) => setLeftPage(Number(e.target.value))}
          className="w-32 md:w-48 h-1.5 bg-stone-700 rounded-full appearance-none cursor-pointer accent-amber-500"
          dir="ltr"
        />

        <div className="text-stone-400 text-xs font-medium">
          {isRTL ? 'منصة ورق الرقمية' : 'Waraq Digital Platform'}
        </div>
      </footer>
    </div>
  );
}
