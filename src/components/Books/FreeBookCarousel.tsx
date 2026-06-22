import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import type { Book } from '../../lib/supabase';
import BookCard from './BookCard';
import { useLang } from '../../contexts/LanguageContext';

type Props = {
  books: Book[];
  title: string;
  onBookClick: (book: Book) => void;
  onViewAll?: () => void;
};

export default function FreeBookCarousel({ books, title, onBookClick, onViewAll }: Props) {
  const { t, lang } = useLang();
  const isRTL = lang === 'ar';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // تحديث حالة الأسهم بناءً على التمرير الحالي
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // في نظام RTL التمرير قد يكون بالسالب اعتماداً على المتصفح
      const absScrollLeft = Math.abs(scrollLeft);
      const maxScroll = scrollWidth - clientWidth;

      if (isRTL) {
        // باللغة العربية
        setCanScrollRight(absScrollLeft > 5);
        setCanScrollLeft(absScrollLeft < maxScroll - 5);
      } else {
        // باللغة الإنجليزية
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < maxScroll - 5);
      }
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      // فحص أولي بعد تحميل الكتب
      setTimeout(updateScrollButtons, 300);
    }
    return () => container?.removeEventListener('scroll', updateScrollButtons);
  }, [books, isRTL]);

  // دالة تحريك السلايدر لليمين واليسار بسلاسة هيدروليكية
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8; // يمرر 80% من مساحة الشاشة الحالية
      const scrollSign = direction === 'left' ? -1 : 1;
      
      scrollContainerRef.current.scrollBy({
        left: scrollAmount * scrollSign,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-12" dir={t.dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-amber-400 rounded-full" />
            <h2
              className="text-2xl font-bold text-stone-800"
              style={{ fontFamily: isRTL ? 'serif' : 'inherit' }}
            >
              {title}
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
              {books.length} {isRTL ? 'كتاب' : 'books'}
            </span>
          </div>

          {/* Chevron nav buttons */}
          <div className="flex items-center gap-2" dir="ltr">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="scroll left"
              className="w-9 h-9 rounded-full border-2 border-amber-300 text-amber-700 flex items-center justify-center hover:bg-amber-50 hover:border-amber-500 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="scroll right"
              className="w-9 h-9 rounded-full border-2 border-amber-300 text-amber-700 flex items-center justify-center hover:bg-amber-50 hover:border-amber-500 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel viewport with native smooth scroll */}
        <div 
          ref={scrollContainerRef} 
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {books.map(book => (
            <div
              key={book.id}
              className="w-[calc(50%-8px)] sm:w-[calc(33.333%-12px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] flex-shrink-0 snap-start"
            >
              <BookCard book={book} onClick={onBookClick} />
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onViewAll}
            className="group flex items-center gap-2.5 px-8 py-3 rounded-full border-2 border-amber-800/50 text-amber-900 font-semibold hover:bg-amber-900 hover:text-amber-50 hover:border-amber-900 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
            style={{ fontFamily: isRTL ? 'serif' : 'inherit' }}
          >
            <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
            {isRTL ? 'عرض جميع الكتب المجانية' : 'View All Free Books'}
          </button>
        </div>

      </div>
    </section>
  );
}
