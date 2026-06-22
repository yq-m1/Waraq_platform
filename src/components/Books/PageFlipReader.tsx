import { useRef, useState, useCallback, useEffect } from 'react';
import React from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

type Props = {
  pages: string[];
  title: string;
  coverUrl?: string | null;
  onClose: () => void;
};

// Left-page variant: spine shadow on the right edge
const LeftPage = React.forwardRef<
  HTMLDivElement,
  { pageNumber: number; totalPages: number; children: React.ReactNode; isRTL: boolean }
>(({ pageNumber, totalPages, children, isRTL }, ref) => (
  <div
    ref={ref}
    style={{
      background: 'linear-gradient(to right, #FDF6E3 0%, #FAF0D7 100%)',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
      userSelect: 'none',
    }}
  >
    {/* Right-edge spine shadow */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 28,
        height: '100%',
        background: 'linear-gradient(to left, rgba(80,40,10,0.18) 0%, rgba(80,40,10,0.06) 50%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
    <PageContent pageNumber={pageNumber} totalPages={totalPages} isRTL={isRTL} side="left">
      {children}
    </PageContent>
  </div>
));
LeftPage.displayName = 'LeftPage';

// Right-page variant: spine shadow on the left edge
const RightPage = React.forwardRef<
  HTMLDivElement,
  { pageNumber: number; totalPages: number; children: React.ReactNode; isRTL: boolean }
>(({ pageNumber, totalPages, children, isRTL }, ref) => (
  <div
    ref={ref}
    style={{
      background: 'linear-gradient(to left, #FDF6E3 0%, #FAF0D7 100%)',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
      userSelect: 'none',
    }}
  >
    {/* Left-edge spine shadow */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 28,
        height: '100%',
        background: 'linear-gradient(to right, rgba(80,40,10,0.18) 0%, rgba(80,40,10,0.06) 50%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
    <PageContent pageNumber={pageNumber} totalPages={totalPages} isRTL={isRTL} side="right">
      {children}
    </PageContent>
  </div>
));
RightPage.displayName = 'RightPage';

function PageContent({
  pageNumber,
  totalPages,
  isRTL,
  side,
  children,
}: {
  pageNumber: number;
  totalPages: number;
  isRTL: boolean;
  side: 'left' | 'right';
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 32px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top rule with page number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'rgba(160,110,50,0.35)' }} />
        <span
          style={{
            fontSize: 10,
            color: 'rgba(120,70,20,0.6)',
            letterSpacing: 2,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'Georgia, serif',
          }}
        >
          {pageNumber}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(160,110,50,0.35)' }} />
      </div>

      {/* Text */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: 'justify',
        }}
      >
        {children}
      </div>

      {/* Bottom ornament */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
          gap: 6,
          marginTop: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 20, height: 1, background: 'rgba(160,110,50,0.3)' }} />
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(160,110,50,0.4)',
          }}
        />
        <div style={{ width: 20, height: 1, background: 'rgba(160,110,50,0.3)' }} />
        <span
          style={{
            fontSize: 9,
            color: 'rgba(120,70,20,0.45)',
            fontFamily: 'Georgia, serif',
            marginLeft: 4,
          }}
        >
          {pageNumber} / {totalPages}
        </span>
      </div>
    </div>
  );
}

export default function PageFlipReader({ pages, title, onClose }: Props) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  // pageW = width of ONE page; book renders two side-by-side in landscape
  const [pageW, setPageW] = useState(380);
  const [pageH, setPageH] = useState(540);

  const totalPages = pages.length;
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  // Responsive sizing: measure available space, fit book inside
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const { width: aw, height: ah } = containerRef.current.getBoundingClientRect();
      // Reserve ~80px for side arrow buttons, ~16px vertical padding
      const usableW = aw - 80;
      const usableH = ah - 16;
      const portrait = usableW < 640;
      setIsPortrait(portrait);

      if (portrait) {
        // Single page: fill width
        const w = Math.min(usableW, 420);
        const h = Math.min(Math.round(w * 1.45), usableH);
        setPageW(w);
        setPageH(h);
      } else {
        // Two pages side by side: each page = half available width
        const maxPageW = Math.min(Math.floor(usableW / 2), 460);
        const h = Math.min(Math.round(maxPageW * 1.42), usableH);
        // Clamp width to maintain aspect ratio
        const w = Math.min(maxPageW, Math.floor(h / 1.42));
        setPageW(w);
        setPageH(h);
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
    fontSize: pageW < 300 ? 13 : pageW < 380 ? 14 : 15.5,
    lineHeight: 2.05,
    color: '#1a1008',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: 'justify',
  };

  // Total visible book width
  const bookTotalW = isPortrait ? pageW : pageW * 2;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 38%, #3a2510 0%, #150d04 100%)' }}
      />

      {/* Header */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-stone-700/50 bg-black/50 backdrop-blur-sm">
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
      <main
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center px-10 md:px-14 py-4 overflow-hidden"
      >
        {/* Warm glow beneath the book */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: bookTotalW + 60,
            height: pageH + 60,
            background: 'radial-gradient(ellipse, rgba(210,160,70,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(28px)',
          }}
        />

        {/* Left arrow */}
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          aria-label={isRTL ? 'التالي' : 'Previous'}
          className="absolute left-2 md:left-3 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-amber-900/60 hover:bg-amber-700 text-amber-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105 disabled:hover:scale-100 backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Book wrapper — outer shadow + spine line overlay */}
        <div style={{ position: 'relative' }}>
          {/* Hard outer shadow to give the book volume */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: '0 32px 90px rgba(0,0,0,0.75), 0 8px 28px rgba(0,0,0,0.55)',
              borderRadius: 3,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Center spine highlight (only in landscape) */}
          {!isPortrait && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 6,
                background:
                  'linear-gradient(to right, rgba(60,30,5,0.55) 0%, rgba(120,70,20,0.18) 40%, rgba(120,70,20,0.18) 60%, rgba(60,30,5,0.55) 100%)',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* @ts-ignore */}
          <HTMLFlipBook
            ref={bookRef}
            width={pageW}
            height={pageH}
            size="fixed"
            minWidth={180}
            maxWidth={520}
            minHeight={260}
            maxHeight={780}
            drawShadow
            flippingTime={750}
            usePortrait
            startZIndex={10}
            autoSize={false}
            maxShadowOpacity={0.55}
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
            {pages.map((text, i) => {
              // Even index → left page, odd → right page
              const PageComp = i % 2 === 0 ? LeftPage : RightPage;
              return (
                <PageComp
                  key={i}
                  pageNumber={i + 1}
                  totalPages={totalPages}
                  isRTL={isRTL}
                >
                  <p style={textStyle}>{text}</p>
                </PageComp>
              );
            })}
          </HTMLFlipBook>
        </div>

        {/* Right arrow */}
        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          aria-label={isRTL ? 'السابق' : 'Next'}
          className="absolute right-2 md:right-3 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-amber-900/60 hover:bg-amber-700 text-amber-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:scale-105 disabled:hover:scale-100 backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 flex items-center justify-between gap-4 px-4 md:px-8 py-3 border-t border-stone-700/50 bg-black/50 backdrop-blur-sm">
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800/80 hover:bg-amber-900/60 text-stone-300 hover:text-amber-100 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          {isRTL ? 'التالي' : 'Previous'}
        </button>

        {/* Page indicator */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-amber-300/80 text-xs font-medium tracking-wide tabular-nums">
            {isRTL
              ? `${currentPage + 1} من ${totalPages}`
              : `Page ${currentPage + 1} of ${totalPages}`}
          </span>
          {/* Dot nav for small page counts */}
          {totalPages <= 12 ? (
            <div className="flex items-center gap-1.5" dir="ltr">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const delta = i - currentPage;
                    const flip = bookRef.current?.pageFlip();
                    if (delta > 0) for (let n = 0; n < delta; n++) flip?.flipNext('bottom');
                    else for (let n = 0; n < -delta; n++) flip?.flipPrev('bottom');
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
          ) : (
            <input
              type="range"
              min={0}
              max={totalPages - 1}
              value={currentPage}
              dir="ltr"
              onChange={(e) => {
                const target = Number(e.target.value);
                const delta = target - currentPage;
                const flip = bookRef.current?.pageFlip();
                if (delta > 0) for (let n = 0; n < delta; n++) flip?.flipNext('bottom');
                else for (let n = 0; n < -delta; n++) flip?.flipPrev('bottom');
              }}
              className="w-32 md:w-48 accent-amber-500 cursor-pointer"
            />
          )}
        </div>

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
