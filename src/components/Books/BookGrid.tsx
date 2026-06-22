import { BookOpen } from 'lucide-react';
import BookCard from './BookCard';
import type { Book } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';

type BookGridProps = {
  books: Book[];
  title: string;
  loading?: boolean;
  onBookClick: (book: Book) => void;
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 animate-pulse">
      <div className="aspect-[2/3] bg-stone-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-stone-200 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function BookGrid({ books, title, loading, onBookClick }: BookGridProps) {
  const { lang } = useLang();

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-7 bg-amber-400 rounded-full" />
          <h2 className="text-2xl font-bold text-stone-800" style={{ fontFamily: lang === 'ar' ? 'serif' : 'inherit' }}>
            {title}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{lang === 'ar' ? 'لا توجد كتب' : 'No books found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} onClick={onBookClick} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
