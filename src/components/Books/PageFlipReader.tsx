import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

export default function PageFlipReader({ book, onClose }: any) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // 1. جلب العنوان الصحيح ديناميكياً حسب لغة الواجهة من السوبربيس
  const bookTitle = isRTL 
    ? (book?.title_ar || book?.book?.title_ar || book?.title || 'كتاب رقمي')
    : (book?.title_en || book?.book?.title_en || book?.title || 'Digital Book');

  // 2. فحص وجلب نص محتوى الكتاب الفعلي من الحقول الثنائية بقاعدة البيانات
  const rawContent = book?.content_ar || book?.book?.content_ar || 
                     book?.book_content_ar || book?.book?.book_content_ar ||
                     book?.pages || book?.book?.pages || 
                     book?.content || book?.book?.content || '';

  // 3. تحويل النص القادم من الداتا بيس إلى مصفوفة صفحات مرنة (تقسيم بناءً على السطور الفارغة أو علامات الترقيم)
  const bookPages = Array.isArray(rawContent)
    ? (rawContent.length > 0 ? rawContent : [(isRTL ? 'لا يوجد محتوى متوفر لهذا الكتاب حالياً.' : 'No content available.')])
    : typeof rawContent === 'string' && rawContent.trim() !== ''
      ? rawContent.split('\n\n').filter(p => p.trim() !== '') // تقسيم النص لصفحات بناءً على المسافات والفقرات ليعطي تأثير التقليب
      : [(isRTL ? 'جاري تحميل محتوى الكتاب من قاعدة البيانات أو النص غير متوفر...' : 'Loading book content from database...')];

  const totalPages = bookPages.length;

  const handleNext = () => {
    if (currentPage < totalPages - 1 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0 && !isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900 bg-opacity-95 z-50 flex flex-col justify-between p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* البار العلوي الديناميكي الأصلي */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4 w-full max-w-3xl mx-auto text-stone-200">
        <h3 className="text-base md:text-lg font-bold truncate max-w-xs sm:max-w-md text-right w-full" style={{ fontFamily: isRTL ? 'serif' : 'inherit' }}>
          {bookTitle}
        </h3>
        <button onClick={onClose} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors text-sm font-medium text-stone-300 shrink-0 mx-2">
          <X className="w-4 h-4" />
          {isRTL ? 'إغلاق' : 'Close'}
        </button>
      </div>

      {/* منطقة القراءة والتنقل بالأسهم */}
      <div className="flex-1 flex items-center justify-center my-4 relative w-full max-w-3xl mx-auto">
        
        {/* سهم التحكم الأيسر */}
        <button 
          onClick={isRTL ? handleNext : handlePrev} 
          disabled={isRTL ? currentPage === totalPages - 1 : currentPage === 0} 
          className="absolute left-2 md:-left-14 z-30 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-900 flex items-center justify-center disabled:opacity-20 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* كارت عرض صفحات الكتاب الحقيقي */}
        <div className="w-full h-[65vh] bg-amber-50 bg-opacity-95 text-stone-900 p-6 md:p-10 rounded-xl shadow-2xl overflow-y-auto flex flex-col justify-between border border-stone-200">
          <div className={isAnimating ? 'opacity-0 transition-opacity duration-200' : 'opacity-100 transition-opacity duration-200'}>
            <p className="leading-relaxed text-right font-serif text-base md:text-lg text-stone-900 whitespace-pre-line">
              {bookPages[currentPage]}
            </p>
          </div>
          
          <div className="text-xs text-stone-400 text-center mt-6 border-t border-stone-200 pt-3">
            {isRTL ? 'الصفحة' : 'Page'} : {currentPage + 1}
          </div>
        </div>

        {/* سهم التحكم الأيمن */}
        <button 
          onClick={isRTL ? handlePrev : handleNext} 
          disabled={isRTL ? currentPage === 0 : currentPage === totalPages - 1} 
          className="absolute right-2 md:-right-14 z-30 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-900 flex items-center justify-center disabled:opacity-20 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

      </div>

      {/* البار السفلي وعداد الصفحات الديناميكي المعكوس ليتناسب مع الاتجاه */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between text-stone-400 text-xs md:text-sm border-t border-stone-800 pt-4" dir="ltr">
        <div className="font-mono bg-stone-800 px-4 py-1 rounded-full text-stone-200 text-xs shadow-inner">
          {currentPage + 1} / {totalPages}
        </div>
        <div className="text-right text-stone-400 text-xs md:text-sm font-sans">
          {isRTL ? 'منصة ورق الرقمية' : 'Waraq Digital Platform'}
        </div>
      </div>

    </div>
  );
}