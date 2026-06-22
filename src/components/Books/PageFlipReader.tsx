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

// ─── Single page component (library assigns left/right automatically) ────────
const Page = React.forwardRef<
  HTMLDivElement,
  { pageNumber: number; totalPages: number; text: string; isRTL: boolean; fontSize: number }
>(({ pageNumber, totalPages, text, isRTL, fontSize }, ref) => (
  <div
    ref={ref}
    className="page-leaf"
    style={{
      backgroundColor: '#F5F5DC',
      color: '#000000',
      opacity: 1,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
      filter: 'none',
    }}
  >
    {/* Top rule */}
    <div
      style={{
        position: 'absolute',
        top: 22,
        left: 28,
        right: 28,
        height: 1,
        background: 'rgba(140,90,30,0.3)',
      }}
    />
    {/* Bottom rule */}
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: 28,
        right: 28,
        height: 1,
        background: 'rgba(140,90,30,0.3)',
      }}
    />
    {/* Page number */}
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: 'rgba(100,60,20,0.55)',
        letterSpacing: 2,
        fontFamily: 'Georgia, serif',
        userSelect: 'none',
      }}
    >
      {pageNumber} / {totalPages}
    </div>

    {/* Main text area */}
    <div
      style={{
        position: 'absolute',
        top: 36,
        bottom: 44,
        left: 28,
        right: 28,
        overflow: 'hidden',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: isRTL ? "'Noto Naskh Arabic', serif" : 'Georgia, serif',
          fontSize: fontSize,
          lineHeight: 2.05,
          color: '#000000',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          textAlign: 'justify',
        }}
      >
        {text}
      </p>
    </div>
  </div>
));
Page.displayName = 'Page';

// ─── Main reader ─────────────────────────────────────────────────────────────
export default function PageFlipReader({ pages, title, onClose }: Props) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const bookRef = useRef<any>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  // pageW = width of ONE page. Library renders TWO pages side-by-side.
  const [pageW, setPageW] = useState(400);
  const [pageH, setPageH] = useState(560);

  const totalPages = pages.length;
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  // Measure available stage area → compute single-page width
  useEffect(() => {
    function measure() {
      if (!stageRef.current) return;
      const { width: aw, height: ah } = stageRef.current.getBoundingClientRect();
      // 100px: side arrow buttons (50px each side)
      // 24px: vertical padding
      const availW = aw - 100;
      const availH = ah - 24;
      // Each page = half of available width (two pages shown side by side)
      const w = Math.max(180, Math.min(Math.floor(availW / 2), 480));
      const h = Math.max(240, Math.min(Math.round(w * 1.45), availH));
      setPageW(w);
      setPageH(h);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  const fontSize = pageW < 280 ? 12 : pageW < 360 ? 13 : pageW < 440 ? 14.5 : 15.5;

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') isRTL ? goPrev() : goNext();
      if (e.key === 'ArrowLeft') isRTL ? goNext() : goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose, isRTL]);

  // Total book render width = pageW * 2 (two pages)
  const bookW = pageW * 2;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: '#1c0f05' }}
    >
      {/* Header */}
      <header
        className="relative z-10 shrink-0 flex items-center justify-between px-4 md:px-8 py-3"
        style={{ background: 'rgba(0,0,0,0.55)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
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
          className="shrink-0 ms-4 flex items-center gap-2 px-3 py-1.5 rounded-lg text-stone-300 hover:text-white text-sm transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <X className="w-4 h-4" />
          {isRTL ? 'إغلاق' : 'Close'}
        </button>
      </header>

      {/* Stage */}
      <main
        ref={stageRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{ padding: '12px 50px' }}
      >
        {/* Left arrow */}
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          aria-label={isRTL ? 'التالي' : 'Previous'}
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            width: 42,
            height: 42,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(180,110,30,0.7)',
            color: '#ffe8b0',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            opacity: (isRTL ? !canGoNext : !canGoPrev) ? 0.2 : 1,
          }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Book wrapper — outer shadow elevates the book off the dark surface */}
        <div
          style={{
            position: 'relative',
            width: pageW * 2,
            height: pageH,
            boxShadow:
              '0 32px 64px rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          {/* Spine shadow — narrow gradient centered on the gutter between pages */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 24,
              zIndex: 30,
              pointerEvents: 'none',
              background:
                'linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.06) 60%, rgba(0,0,0,0.22) 100%)',
            }}
          />

          {/* @ts-ignore — react-pageflip has loose prop typings */}
          <HTMLFlipBook
            ref={bookRef}
            width={pageW}
            height={pageH}
            size="fixed"
            minWidth={160}
            maxWidth={500}
            minHeight={220}
            maxHeight={750}
            drawShadow={false}
            flippingTime={750}
            usePortrait={false}
            startZIndex={10}
            autoSize={false}
            maxShadowOpacity={0.1}
            showCover={false}
            mobileScrollSupport={false}
            useMouseEvents={true}
            showPageCorners={true}
            swipeDistance={30}
            clickEventForward={false}
            disableFlipByClick={false}
            startPage={0}
            className=""
            style={{ display: 'block' }}
            onFlip={handleFlip}
          >
            {pages.map((text, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                totalPages={totalPages}
                text={text}
                isRTL={isRTL}
                fontSize={fontSize}
              />
            ))}
          </HTMLFlipBook>
        </div>

        {/* Right arrow */}
        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          aria-label={isRTL ? 'السابق' : 'Next'}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            width: 42,
            height: 42,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(180,110,30,0.7)',
            color: '#ffe8b0',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
            opacity: (isRTL ? !canGoPrev : !canGoNext) ? 0.2 : 1,
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 shrink-0 flex items-center justify-between gap-4 px-4 md:px-8 py-3"
        style={{ background: 'rgba(0,0,0,0.55)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-stone-300 hover:text-amber-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          {isRTL ? 'التالي' : 'Previous'}
        </button>

        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <span className="text-amber-300/80 text-xs font-medium tracking-wide tabular-nums">
            {isRTL ? `${currentPage + 1} من ${totalPages}` : `Page ${currentPage + 1} of ${totalPages}`}
          </span>
          {totalPages <= 16 ? (
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
                  style={{
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    background: i === currentPage ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                    width: i === currentPage ? 20 : 8,
                    height: 8,
                    transition: 'all 0.2s',
                  }}
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-stone-300 hover:text-amber-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          {isRTL ? 'السابق' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
