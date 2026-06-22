import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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

const PAGE_BG = '#F5F5DC';
const PAGE_TEXT = '#000000';

// Single page rendered inside the flipbook spread
const BookPage = React.forwardRef<
  HTMLDivElement,
  { pageNumber: number; totalPages: number; text: string; isRTL: boolean; fontSize: number }
>(({ pageNumber, totalPages, text, isRTL, fontSize }, ref) => (
  <div
    ref={ref}
    className="custom-paper-page"
    style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#F5F5DC',
      backgroundImage: 'none',
      color: '#000000',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}
  >
    {/* Top decorative rule */}
    <div
      style={{
        position: 'absolute',
        top: 22,
        left: 32,
        right: 32,
        height: 1,
        backgroundColor: 'rgba(110,75,15,0.22)',
      }}
    />

    {/* Bottom decorative rule */}
    <div
      style={{
        position: 'absolute',
        bottom: 30,
        left: 32,
        right: 32,
        height: 1,
        backgroundColor: 'rgba(110,75,15,0.22)',
      }}
    />

    {/* Page number */}
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: 'rgba(80,50,10,0.45)',
        fontFamily: 'Georgia, serif',
        letterSpacing: 1.5,
        userSelect: 'none',
      }}
    >
      {pageNumber} / {totalPages}
    </div>

    {/* Text content — 32px inset on all sides keeps text strictly inside the paper */}
    <div
      style={{
        position: 'absolute',
        top: 38,
        bottom: 46,
        left: 32,
        right: 32,
        overflow: 'hidden',
        boxSizing: 'border-box',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <p
        style={{
          margin: 0,
          padding: 0,
          fontFamily: isRTL
            ? "'Noto Naskh Arabic', Georgia, serif"
            : 'Georgia, "Times New Roman", serif',
          fontSize,
          lineHeight: 2,
          color: '#000000',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          textAlign: 'justify',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {text}
      </p>
    </div>
  </div>
));
BookPage.displayName = 'BookPage';

// Arrow button shared between left/right
function ArrowButton({
  onClick,
  disabled,
  side,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  side: 'left' | 'right';
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        position: 'absolute',
        [side]: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(185,120,35,0.75)',
        color: '#fff8e0',
        border: 'none',
        cursor: 'pointer',
        opacity: disabled ? 0.2 : 1,
        transition: 'opacity 0.2s, background 0.2s',
      }}
    >
      {children}
    </button>
  );
}

export default function PageFlipReader({ pages, title, onClose }: Props) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const bookRef = useRef<any>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageW, setPageW] = useState(380);
  const [pageH, setPageH] = useState(540);

  const totalPages = pages.length;

  // react-pageflip has no native RTL support. For Arabic, we swap adjacent
  // page pairs in the array so the library's even-index (LEFT slot) gets the
  // higher-numbered page and the odd-index (RIGHT slot) gets the lower-numbered
  // page. Result: page 1 lands on the right of spread 1, page 3 on the right
  // of spread 2, etc. — correct Arabic book layout, no CSS transforms needed.
  const renderedPages = useMemo(() => {
    if (!isRTL) return pages.map((text, i) => ({ text, pageNum: i + 1 }));
    const result: { text: string; pageNum: number }[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      if (i + 1 < pages.length) {
        result.push({ text: pages[i + 1], pageNum: i + 2 }); // LEFT slot
        result.push({ text: pages[i],     pageNum: i + 1 }); // RIGHT slot
      } else {
        result.push({ text: '',       pageNum: 0     }); // blank LEFT pad
        result.push({ text: pages[i], pageNum: i + 1 }); // RIGHT slot
      }
    }
    return result;
  }, [pages, isRTL]);

  const renderedCount = renderedPages.length;
  const canGoPrev = currentPage > 0;
  // Last reachable left-page index is renderedCount-2 (final spread)
  const canGoNext = currentPage < renderedCount - 2;

  // Measure the stage and derive page dimensions
  useEffect(() => {
    function measure() {
      if (!stageRef.current) return;
      const { width: aw, height: ah } = stageRef.current.getBoundingClientRect();
      const availW = aw - 120; // 60px per arrow button side
      const availH = ah - 40;
      const w = Math.max(180, Math.min(Math.floor(availW / 2), 460));
      const h = Math.max(260, Math.min(Math.round(w * 1.42), availH));
      setPageW(w);
      setPageH(h);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  const fontSize = pageW < 260 ? 12 : pageW < 340 ? 13 : pageW < 420 ? 14 : 15;

  const goNext = useCallback(() => {
    if (canGoNext) bookRef.current?.pageFlip()?.flipNext('bottom');
  }, [canGoNext]);

  const goPrev = useCallback(() => {
    if (canGoPrev) bookRef.current?.pageFlip()?.flipPrev('bottom');
  }, [canGoPrev]);

  const handleFlip = useCallback((e: any) => setCurrentPage(e.data), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') isRTL ? goPrev() : goNext();
      else if (e.key === 'ArrowLeft') isRTL ? goNext() : goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose, isRTL]);

  const jumpToPage = useCallback(
    (target: number) => {
      const flip = bookRef.current?.pageFlip();
      if (!flip) return;
      const delta = target - currentPage;
      if (delta > 0) for (let n = 0; n < delta; n++) flip.flipNext('bottom');
      else if (delta < 0) for (let n = 0; n < -delta; n++) flip.flipPrev('bottom');
    },
    [currentPage],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: '#221208' }}
    >
      {/* ── Header ── */}
      <header
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen className="w-5 h-5 shrink-0 text-amber-400" />
          <span
            className="text-amber-100 font-semibold text-sm md:text-base truncate"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 ms-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-300 hover:text-white text-sm transition-colors"
          style={{ background: 'rgba(255,255,255,0.09)' }}
        >
          <X className="w-4 h-4" />
          {isRTL ? 'إغلاق' : 'Close'}
        </button>
      </header>

      {/* ── Stage ── */}
      <main
        ref={stageRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{ padding: '20px 64px' }}
      >
        <ArrowButton
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          side="left"
          label={isRTL ? 'التالي' : 'Previous'}
        >
          <ChevronLeft className="w-5 h-5" />
        </ArrowButton>

        {/* Book container: outer shadow lifts the spread off the dark stage */}
        <div
          style={{
            position: 'relative',
            width: pageW * 2,
            height: pageH,
            boxShadow:
              '0 28px 60px rgba(0,0,0,0.72), 0 6px 20px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.35)',
          }}
        >
          {/* Spine shadow — thin gradient at the center fold */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 20,
              zIndex: 20,
              pointerEvents: 'none',
              background:
                'linear-gradient(to right, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.20) 100%)',
            }}
          />

          {/* @ts-ignore — react-pageflip has loose prop typings */}
          <HTMLFlipBook
            ref={bookRef}
            width={pageW}
            height={pageH}
            size="fixed"
            minWidth={160}
            maxWidth={480}
            minHeight={220}
            maxHeight={700}
            drawShadow={false}
            flippingTime={700}
            usePortrait={false}
            autoSize={false}
            maxShadowOpacity={0}
            showCover={false}
            mobileScrollSupport={false}
            useMouseEvents={true}
            showPageCorners={true}
            swipeDistance={30}
            clickEventForward={false}
            disableFlipByClick={false}
            startPage={0}
            startZIndex={10}
            style={{ display: 'block' }}
            className=""
            onFlip={handleFlip}
          >
            {renderedPages.map(({ text, pageNum }, i) => (
              <BookPage
                key={i}
                pageNumber={pageNum}
                totalPages={totalPages}
                text={text}
                isRTL={isRTL}
                fontSize={fontSize}
              />
            ))}
          </HTMLFlipBook>
        </div>

        <ArrowButton
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          side="right"
          label={isRTL ? 'السابق' : 'Next'}
        >
          <ChevronRight className="w-5 h-5" />
        </ArrowButton>
      </main>

      {/* ── Footer ── */}
      <footer
        className="shrink-0 flex items-center justify-between gap-4 px-5 py-3"
        style={{
          background: 'rgba(0,0,0,0.6)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={isRTL ? goNext : goPrev}
          disabled={isRTL ? !canGoNext : !canGoPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-stone-300 hover:text-amber-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          {isRTL ? 'التالي' : 'Previous'}
        </button>

        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <span className="text-amber-300/80 text-xs font-medium tracking-wide tabular-nums">
            {isRTL
              ? `${currentPage + 1} من ${totalPages}`
              : `Page ${currentPage + 1} of ${totalPages}`}
          </span>

          {totalPages <= 20 ? (
            <div className="flex items-center gap-1" dir="ltr">
              {pages.map((_, i) => {
                // For RTL, two original pages share a spread; target the
                // left-page index of that spread (always even).
                const target = isRTL ? Math.floor(i / 2) * 2 : i;
                const active = isRTL
                  ? Math.floor(i / 2) * 2 === currentPage
                  : i === currentPage;
                return (
                  <button
                    key={i}
                    onClick={() => jumpToPage(target)}
                    aria-label={`Go to page ${i + 1}`}
                    style={{
                      width: active ? 18 : 7,
                      height: 7,
                      borderRadius: 9999,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      background: active ? '#f59e0b' : 'rgba(255,255,255,0.22)',
                      transition: 'all 0.2s',
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <input
              type="range"
              min={0}
              max={totalPages - 1}
              value={currentPage}
              dir="ltr"
              onChange={(e) => jumpToPage(Number(e.target.value))}
              className="w-36 md:w-52 accent-amber-500 cursor-pointer"
            />
          )}
        </div>

        <button
          onClick={isRTL ? goPrev : goNext}
          disabled={isRTL ? !canGoPrev : !canGoNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-stone-300 hover:text-amber-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          {isRTL ? 'السابق' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
