import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Search, LogOut, User, X, Menu, Heart, Clock,
  Star, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, type Book } from '../../lib/supabase';

type ProfilePage = 'favorites' | 'recently-viewed' | 'my-reviews';

type NavbarProps = {
  onBookClick: (book: Book) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onNavigate: (page: 'home' | 'library' | ProfilePage) => void;
  currentPage: string;
};

export default function Navbar({ onBookClick, onOpenAuth, onNavigate, currentPage }: NavbarProps) {
  const { t, lang, toggleLang } = useLang();
  const { user, profile, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(() => window.scrollY > 20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayName = profile?.username || user?.email?.split('@')[0] || '';

  function handleNavigate(page: 'home' | 'library' | ProfilePage) {
    onNavigate(page);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-amber-950/95 backdrop-blur-md shadow-lg shadow-amber-950/20'
          : 'bg-amber-950/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Main nav row ── */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

          {/* Logo */}
          <button
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-400 rounded-lg flex items-center justify-center group-hover:bg-amber-300 transition-colors">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950" />
            </div>
            <span
              className="text-white font-bold text-lg sm:text-xl tracking-wide"
              style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
            >
              {lang === 'ar' ? 'وَرَق' : 'Waraq'}
            </span>
          </button>

          {/* Desktop search */}
          <div className="hidden md:block flex-1 max-w-xl">
            <SearchBox onBookClick={onBookClick} />
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Mobile search toggle */}
            <button
              onClick={() => { setMobileSearchOpen(o => !o); setMobileMenuOpen(false); }}
              className="md:hidden p-2 text-amber-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
              aria-label="Toggle search"
            >
              {mobileSearchOpen
                ? <X className="w-4 h-4" />
                : <Search className="w-4 h-4" />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1.5 text-xs font-semibold text-amber-200 border border-amber-200/30 rounded-full hover:bg-amber-400/20 hover:text-white hover:border-amber-400/50 transition-all"
            >
              {lang === 'ar' ? 'EN' : 'ع'}
            </button>

            {user ? (
              <div className="flex items-center gap-1">
                {/* Desktop user dropdown */}
                <UserDropdown
                  displayName={displayName}
                  lang={lang}
                  onNavigate={handleNavigate}
                  onSignOut={signOut}
                />
                {/* Mobile logout shortcut */}
                <button
                  onClick={signOut}
                  title={t.nav.logout}
                  className="sm:hidden p-2 text-amber-200/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-sm text-amber-200 hover:text-white transition-colors"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3 py-1.5 text-sm bg-amber-400 text-amber-950 font-semibold rounded-full hover:bg-amber-300 transition-colors"
                >
                  {t.nav.signup}
                </button>
              </div>
            )}

            {/* Hamburger */}
            <button
              className="sm:hidden p-2 text-amber-200 hover:text-white transition-colors"
              onClick={() => { setMobileMenuOpen(o => !o); setMobileSearchOpen(false); }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile search panel (collapsible) ── */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <SearchBox
              onBookClick={onBookClick}
              onAfterSelect={() => setMobileSearchOpen(false)}
              isMobile
              autoFocus
            />
          </div>
        )}

        {/* ── Mobile menu ── */}
        {mobileMenuOpen && (
          <div className="sm:hidden pb-4 border-t border-white/10 pt-3 space-y-1" dir={t.dir}>
            {user ? (
              <>
                <div className="flex items-center gap-2 px-2 py-2 mb-1">
                  <div className="w-7 h-7 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span className={`text-amber-200 text-sm font-medium flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    {displayName}
                  </span>
                </div>
                {([
                  { icon: Star,  label: t.profile.my_reviews,     page: 'my-reviews'      as ProfilePage },
                  { icon: Heart, label: t.profile.favorites,       page: 'favorites'       as ProfilePage },
                  { icon: Clock, label: t.profile.recently_viewed, page: 'recently-viewed' as ProfilePage },
                ] as const).map(({ icon: Icon, label, page }) => (
                  <button
                    key={page}
                    onClick={() => handleNavigate(page)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/10 rounded-xl transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-amber-400/70 group-hover:text-amber-200 flex-shrink-0" />
                    <span className={`text-sm text-amber-200/80 group-hover:text-white whitespace-nowrap ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      {label}
                    </span>
                  </button>
                ))}
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-red-500/10 rounded-xl transition-colors group"
                >
                  <LogOut className="w-4 h-4 text-red-400/70 group-hover:text-red-300 flex-shrink-0" />
                  <span className={`text-sm text-red-400/80 group-hover:text-red-300 whitespace-nowrap ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                    {t.nav.logout}
                  </span>
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-2">
                <button
                  onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                  className="flex-1 py-2 text-sm text-center text-amber-200 border border-amber-200/30 rounded-full hover:bg-white/10 transition-colors"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => { onOpenAuth('signup'); setMobileMenuOpen(false); }}
                  className="flex-1 py-2 text-sm text-center bg-amber-400 text-amber-950 font-semibold rounded-full hover:bg-amber-300 transition-colors"
                >
                  {t.nav.signup}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

// ── SearchBox ─────────────────────────────────────────────────────────────────

type SearchBoxProps = {
  onBookClick: (book: Book) => void;
  onAfterSelect?: () => void;
  isMobile?: boolean;
  autoFocus?: boolean;
};

function SearchBox({ onBookClick, onAfterSelect, isMobile = false, autoFocus = false }: SearchBoxProps) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when activated on mobile
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape to close
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Debounced Supabase query
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('books')
        .select('id, title_ar, title_en, cover_url, is_free_to_read')
        .or(`title_ar.ilike.%${q}%,title_en.ilike.%${q}%`)
        .limit(8);
      setResults((data ?? []) as Book[]);
      setOpen(true);
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(book: Book) {
    onBookClick(book);
    onAfterSelect?.();
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.blur();
  }

  const showDropdown = query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-200 ${focused && !isMobile ? 'scale-[1.02]' : ''}`}
    >
      {/* Input */}
      <div className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${
            lang === 'ar' ? 'right-3' : 'left-3'
          } ${focused ? 'text-amber-400' : 'text-amber-200/60'}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (query.trim() && results.length > 0) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder={t.nav.search_placeholder}
          className={`w-full bg-white/10 border border-white/20 rounded-full py-2 text-sm text-white placeholder-amber-200/50 focus:outline-none focus:border-amber-400 focus:bg-white/15 transition-all ${
            lang === 'ar' ? 'pr-9 pl-9' : 'pl-9 pr-9'
          }`}
          dir={t.dir}
        />
        {query && (
          <button
            onMouseDown={e => { e.preventDefault(); setQuery(''); setOpen(false); }}
            className={`absolute top-1/2 -translate-y-1/2 text-amber-200/60 hover:text-white transition-colors ${
              lang === 'ar' ? 'left-3' : 'right-3'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className={`absolute left-0 right-0 mt-2 z-[60] bg-amber-950 border border-amber-800/40 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col ${
            isMobile ? 'max-h-[60vh]' : 'max-h-[440px]'
          }`}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div
              className="py-7 text-center text-amber-300/50 text-sm"
              style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
            >
              {lang === 'ar' ? `لا نتائج لـ "${query}"` : `No results for "${query}"`}
            </div>
          ) : (
            <>
              <div className="overflow-y-auto flex-1 py-1.5">
                {results.map(book => (
                  <SearchResultRow
                    key={book.id}
                    book={book}
                    lang={lang}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
              {results.length === 8 && (
                <div
                  className="px-4 py-2.5 border-t border-amber-800/30 text-center text-xs text-amber-400/50"
                  style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}
                >
                  {lang === 'ar' ? 'اكتب أكثر لتضييق النتائج' : 'Type more to narrow results'}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── SearchResultRow ────────────────────────────────────────────────────────────

function SearchResultRow({
  book,
  lang,
  onSelect,
}: {
  book: Book;
  lang: string;
  onSelect: (book: Book) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const title = lang === 'ar' ? book.title_ar : book.title_en;
  const showImg = !!book.cover_url && !imgFailed;

  return (
    <button
      onMouseDown={e => { e.preventDefault(); onSelect(book); }}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-800/30 transition-colors group"
    >
      {/* Mini cover */}
      <div className="w-9 h-[52px] rounded-lg overflow-hidden flex-shrink-0 bg-amber-900/40 flex items-center justify-center">
        {showImg ? (
          <img
            src={book.cover_url!}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <BookOpen className="w-4 h-4 text-amber-600/40" />
        )}
      </div>

      {/* Title + badge */}
      <div className={`flex-1 min-w-0 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
        <p className="text-amber-100 text-sm font-medium truncate group-hover:text-white transition-colors">
          {title}
        </p>
        <span
          className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            book.is_free_to_read
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-stone-700/40 text-stone-400'
          }`}
        >
          {book.is_free_to_read
            ? (lang === 'ar' ? 'مجاني' : 'Free')
            : (lang === 'ar' ? 'مدفوع' : 'Paid')}
        </span>
      </div>

      <ChevronRight className="w-4 h-4 text-amber-700/40 group-hover:text-amber-400/70 transition-colors flex-shrink-0" />
    </button>
  );
}

// ── UserDropdown ──────────────────────────────────────────────────────────────

type DropdownProps = {
  displayName: string;
  lang: string;
  onNavigate: (page: ProfilePage) => void;
  onSignOut: () => void;
};

function UserDropdown({ displayName, lang, onNavigate, onSignOut }: DropdownProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [
    { icon: Star,  label: t.profile.my_reviews,     page: 'my-reviews'      as ProfilePage },
    { icon: Heart, label: t.profile.favorites,       page: 'favorites'       as ProfilePage },
    { icon: Clock, label: t.profile.recently_viewed, page: 'recently-viewed' as ProfilePage },
  ];

  const isAr = lang === 'ar';

  function MenuItem({
    icon: Icon,
    label,
    onClick,
    className = 'text-amber-200/75 hover:text-white hover:bg-amber-800/40',
    iconClass = 'text-amber-400/60',
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    className?: string;
    iconClass?: string;
  }) {
    if (isAr) {
      return (
        <button
          dir="rtl"
          onClick={onClick}
          className={`w-full flex items-center justify-start space-x-3 space-x-reverse px-4 py-2.5 transition-colors ${className}`}
        >
          <span className="text-sm text-right leading-snug">{label}</span>
          <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
        </button>
      );
    }
    return (
      <button
        dir="ltr"
        onClick={onClick}
        className={`w-full flex items-center justify-start space-x-3 px-4 py-2.5 transition-colors ${className}`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
        <span className="text-sm text-left leading-snug">{label}</span>
      </button>
    );
  }

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 rounded-full transition-all"
      >
        <div className="w-5 h-5 bg-amber-400/30 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-amber-200" />
        </div>
        <span className="text-amber-200 text-xs font-medium max-w-[100px] truncate">{displayName}</span>
        <ChevronDown className={`w-3 h-3 text-amber-300/60 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute top-[calc(100%+8px)] w-64 left-auto right-0 bg-amber-950 border border-amber-800/40 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden z-50 transition-all duration-200 origin-top-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="flex items-center space-x-2.5 px-4 py-3 border-b border-amber-800/30"
        >
          <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-amber-300" />
          </div>
          <p className={`text-amber-100 text-sm font-semibold truncate ${isAr ? 'text-right' : 'text-left'}`}>
            {displayName}
          </p>
        </div>

        <div className="py-1">
          {items.map(({ icon: Icon, label, page }) => (
            <MenuItem
              key={page}
              icon={Icon}
              label={label}
              onClick={() => { onNavigate(page); setOpen(false); }}
            />
          ))}
        </div>

        <div className="border-t border-amber-800/30 py-1">
          <MenuItem
            icon={LogOut}
            label={t.nav.logout}
            onClick={() => { onSignOut(); setOpen(false); }}
            className="text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
            iconClass="text-red-400/70"
          />
        </div>
      </div>
    </div>
  );
}
