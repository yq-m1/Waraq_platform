import { BookOpen, Heart } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const linkGroups = [
  {
    headingAr: 'روابط سريعة',
    headingEn: 'Quick Links',
    items: [
      { ar: 'الرئيسية',    en: 'Home' },
      { ar: 'تصفح الكتب', en: 'Browse Books' },
      { ar: 'من نحن',     en: 'About Us' },
    ],
  },
  {
    headingAr: 'المجتمع',
    headingEn: 'Community',
    items: [
      { ar: 'المراجعات',    en: 'Reviews' },
      { ar: 'التوصيات',    en: 'Recommendations' },
      { ar: 'الأكثر قراءة', en: 'Most Read' },
    ],
  },
  {
    headingAr: 'مساعدة',
    headingEn: 'Help',
    items: [
      { ar: 'اتصل بنا',        en: 'Contact Us' },
      { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
      { ar: 'شروط الاستخدام',  en: 'Terms of Use' },
    ],
  },
];

export default function Footer() {
  const { lang } = useLang();
  const year = new Date().getFullYear();
  const isAr = lang === 'ar';

  return (
    <footer
      className="bg-amber-950 border-t border-amber-900/40 mt-24"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Main grid ── */}
        <div className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand — spans 2 of 5 columns on large screens */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-900/40">
                <BookOpen className="w-5 h-5 text-amber-950" />
              </div>
              <span
                className="text-white font-bold text-2xl tracking-wide leading-none"
                style={{ fontFamily: isAr ? 'serif' : 'inherit' }}
              >
                {isAr ? 'وَرَق' : 'Waraq'}
              </span>
            </div>

            <p className="text-amber-300/55 text-sm leading-[1.85] max-w-sm">
              {isAr
                ? 'منصة عربية متكاملة مخصصة لمحبّي القراءة — اكتشف الكتب، اقرأ المراجعات، وشارك تجربتك الأدبية مع مجتمع القرّاء.'
                : 'A comprehensive Arabic platform for book lovers — discover titles, read reviews, and share your literary journey with a community of readers.'}
            </p>

            <p className="text-amber-300/30 text-xs mt-1">
              {isAr ? 'منصة الكتب والمراجعات' : 'Books & Reviews Platform'}
            </p>
          </div>

          {/* Divider visible on large screens only */}
          <div className="hidden lg:block lg:col-span-3">
            <div className={`grid grid-cols-3 gap-8 ${isAr ? 'text-right' : 'text-left'}`}>
              {linkGroups.map((group) => (
                <div key={group.headingAr} className="flex flex-col gap-4">
                  <h4 className="text-amber-400 text-xs font-bold uppercase tracking-[0.12em]">
                    {isAr ? group.headingAr : group.headingEn}
                  </h4>
                  <ul className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <li key={item.ar}>
                        <a
                          href="#"
                          className="text-amber-300/55 hover:text-amber-200 text-sm transition-colors duration-150 hover:underline underline-offset-2"
                        >
                          {isAr ? item.ar : item.en}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Link groups on small/medium screens (below brand) */}
          {linkGroups.map((group) => (
            <div key={group.headingAr} className="lg:hidden flex flex-col gap-4">
              <h4 className="text-amber-400 text-xs font-bold uppercase tracking-[0.12em]">
                {isAr ? group.headingAr : group.headingEn}
              </h4>
              <ul className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <li key={item.ar}>
                    <a
                      href="#"
                      className="text-amber-300/55 hover:text-amber-200 text-sm transition-colors duration-150"
                    >
                      {isAr ? item.ar : item.en}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-amber-900/35 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-amber-300/30 text-xs">
            {isAr
              ? `© ${year} وَرَق — جميع الحقوق محفوظة`
              : `© ${year} Waraq — All rights reserved`}
          </p>
          <p className="text-amber-300/30 text-xs flex items-center gap-1.5">
            {isAr ? (
              <>صُنع بـ <Heart className="w-3 h-3 text-red-400/70 fill-red-400/70" /> لمحبّي الكتب</>
            ) : (
              <>Made with <Heart className="w-3 h-3 text-red-400/70 fill-red-400/70" /> for book lovers</>
            )}
          </p>
        </div>

      </div>
    </footer>
  );
}
