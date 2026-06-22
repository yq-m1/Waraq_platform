import { useRef, useState, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

type Props = {
  pages: string[];
  title: string;
  coverUrl?: string | null;
  onClose: () => void;
};

// Individual page component — must be a forwardRef for react-pageflip
import React from 'react';

const BookPage = React.forwardRef<
  HTMLDivElement,
  { pageNumber: number; totalPages: number; children: React.ReactNode; isRTL: boolean }
>(({ pageNumber, totalPages, children, isRTL }, ref) => (
  <div
    ref={ref}
    className="book-page-texture"
    style={{
      background: 'linear-gradient(160deg, #F8F3E8 0%, #EDE4D3 55%, #E4D8C0 100%)',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      userSelect: 'none',
    }}
  >
    {/* Spine shadow on right edge (left-page) or left edge (right-page) */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 20,
        right: 0,
        background: 'linear-gradient(to left, rgba(100,60,20,0.14), transparent)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
    {/* Content */}
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 36px 24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top rule */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(180,130,60,0.3)' }} />
        <span style={{ fontSize: 10, color: 'rgba(130,80,20,0.5)', fontVariantNumeric: 'tabular-nums', letterSpacing: 2 }}>
          {pageNumber}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(180,130,60,0.3)' }} />
      </div>

      {/* Text */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {children}
      </div>

      {/* Bottom ornament */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, flexShrink: 0 }}>
        <div style={{ width: 24, height: 1, background: 'rgba(180,130,60,0.3)' }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(180,130,60,0.35)' }} />
        <div style={{ width: 24, height: 1, background: 'rgba(180,130,60,0.3)' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(130,80,20,0.35)', marginTop: 4 }}>
        {pageNumber} / {totalPages}
      </div>
    </div>
  </div>
));
BookPage.displayName = 'BookPage';

export default function PageFlipReader({ pages, title, onClose }: Props) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const [bookDims, setBookDims] = useState({ width: 420, height: 580 });

  const totalPages = pages.length;
  // In landscape (two-page spread), a "spread" = 2 pages; in portrait = 1 page
  const totalSpreads = isPortrait ? totalPages : Math.ceil(totalPages / 2);
  const currentSpread = isPortrait ? currentPage : Math.floor(currentPage / 2);

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  // Compute page dimensions responsively from container
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availW = rect.width - 80; // subtract nav arrow space
      const availH = rect.height - 16;
      const portrait = availW < 680;
      setIsPortrait(portrait);

      if (portrait) {
        const w = Math.min(availW, 420);
        setBookDims({ width: w, height: Math.round(w * 1.45) });
      } else {
        const pageW = Math.min(Math.floor(availW / 2), 460);
        const pageH = Math.min(Math.round(pageW * 1.42), availH);
        setBookDims({ width: pageW, height: pageH });
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    bookRef.current?.pageFlip()?.flipNext('bottom');
  }, [canGoNext]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    bookRef.current?.pageFlip()?.flipPrev('bottom');
  }, [canGoPrev]);

  const handleFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
  }, []);

  const handleChangeOrientation = useCallback((e: any) => {
    setIsPortrait(e.data === 'portrait');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') isRTL ? goPrev() : goNext();
      if (e.key === 'ArrowLeft') isRTL ? goNext() : goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose, isRTL]);

  const textStyle: React.CSSProperties = {
    fontFamily: isRTL ? "'Noto Naskh Arabic', serif" : 'Georgia, serif',
    fontSize: bookDims.width < 340 ? 13 : 15,
    lineHeight: 2.1,
    color: '#2C2416',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, #3d2b1a 0%, #1a1008 100%)' }}
      />

      {/* Header */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-stone-700/50 bg-black/40 backdrop-blur-sm">
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
          className="shrink-0 ms-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-amber-200 transition-colors text-sm"
        >
          <X className="w-4 h-4" />
          {isRTL ? 'إغلاق' : 'Close'}
        </button>
      </header>

      {/* Book stage */}
      <main ref={containerRef} className="relative flex-1 flex items-center justify-center px-10 md:px-16 py-4 overflow-hidden">
        {/* Ambient glow under book */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: bookDims.width * (isPortrait ? 1 : 2) + 40,
            height: bookDims.height + 40,
            background: 'radial-gradient(ellipse, rgba(200,150,60,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(24px)',
          }}
        />

        {/* Left nav arrow */}
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          aria-label={isRTL ? 'التالي' : 'Previous'}
          className="absolute left-2 md:left-4 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-amber-900/60 hover:bg-amber-700 text-amber-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105 disabled:hover:scale-100 backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* The FlipBook */}
        <div
          style={{
            boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)',
            borderRadius: 4,
            position: 'relative',
          }}
        >
          {/* @ts-ignore – react-pageflip has loose types */}
          <HTMLFlipBook
            ref={bookRef}
            width={bookDims.width}
            height={bookDims.height}
            size="fixed"
            minWidth={200}
            maxWidth={520}
            minHeight={280}
            maxHeight={780}
            drawShadow
            flippingTime={700}
            usePortrait={true}
            startZIndex={10}
            autoSize={false}
            maxShadowOpacity={0.5}
            showCover={false}
            mobileScrollSupport={false}
            useMouseEvents
            showPageCorners
            swipeDistance={30}
            clickEventForward={false}
            startPage={0}
            className=""
            style={{}}
            onFlip={handleFlip}
            onChangeOrientation={handleChangeOrientation}
          >
            {pages.map((text, i) => (
              <BookPage
                key={i}
                pageNumber={i + 1}
                totalPages={totalPages}
                isRTL={isRTL}
              >
                <p style={textStyle}>{text}</p>
              </BookPage>
            ))}
          </HTMLFlipBook>
        </div>

        {/* Right nav arrow */}
        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          aria-label={isRTL ? 'السابق' : 'Next'}
          className="absolute right-2 md:right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-amber-900/60 hover:bg-amber-700 text-amber-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105 disabled:hover:scale-100 backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 flex items-center justify-between gap-4 px-4 md:px-8 py-3 border-t border-stone-700/50 bg-black/40 backdrop-blur-sm">
        {/* Prev button */}
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800/80 hover:bg-amber-900/60 text-stone-300 hover:text-amber-100 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          {isRTL ? 'التالي' : 'Previous'}
        </button>

        {/* Dots + counter */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-amber-300/70 text-xs font-medium tracking-wide tabular-nums">
            {isRTL
              ? `${currentPage + 1} من ${totalPages}`
              : `Page ${currentPage + 1} of ${totalPages}`}
          </span>
          {totalPages <= 12 && (
            <div className="flex items-center gap-1" dir="ltr">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const delta = i - currentPage;
                    if (delta > 0) for (let n = 0; n < delta; n++) bookRef.current?.pageFlip()?.flipNext('bottom');
                    else for (let n = 0; n < -delta; n++) bookRef.current?.pageFlip()?.flipPrev('bottom');
                  }}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentPage
                      ? 'w-5 h-2 bg-amber-400'
                      : 'w-2 h-2 bg-stone-600 hover:bg-stone-500'
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
          )}
          {totalPages > 12 && (
            <input
              type="range"
              min={0}
              max={totalPages - 1}
              value={currentPage}
              dir="ltr"
              onChange={(e) => {
                const target = Number(e.target.value);
                const delta = target - currentPage;
                if (delta > 0) for (let n = 0; n < delta; n++) bookRef.current?.pageFlip()?.flipNext('bottom');
                else for (let n = 0; n < -delta; n++) bookRef.current?.pageFlip()?.flipPrev('bottom');
              }}
              className="w-32 md:w-48 accent-amber-500 cursor-pointer"
            />
          )}
        </div>

        {/* Next button */}
        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800/80 hover:bg-amber-900/60 text-stone-300 hover:text-amber-100 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isRTL ? 'السابق' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
