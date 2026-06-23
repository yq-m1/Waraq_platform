import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import AuthModal from './components/Auth/AuthModal';
import Home from './pages/Home';
import BookDetail from './pages/BookDetail';
import FavoritesPage from './pages/FavoritesPage';
import FreeBooksPage from './pages/FreeBooksPage';
import RecentlyViewedPage from './pages/RecentlyViewedPage';
import MyReviewsPage from './pages/MyReviewsPage';
import type { Book } from './lib/supabase';

type Page =
  | { name: 'home' }
  | { name: 'book'; bookId: string }
  | { name: 'favorites' }
  | { name: 'free-books' }
  | { name: 'recently-viewed' }
  | { name: 'my-reviews' };

type AuthModalState = { open: false } | { open: true; mode: 'login' | 'signup' };

function AppInner() {
  const { isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [page, setPage] = useState<Page>({ name: 'home' });
  const [authModal, setAuthModal] = useState<AuthModalState>({ open: false });

  function openAuth(mode: 'login' | 'signup') {
    setAuthModal({ open: true, mode });
  }

  function closeAuth() {
    setAuthModal({ open: false });
  }

  function handleBookClick(book: Book) {
    setPage({ name: 'book', bookId: book.id });
  }

  function handleBookClickById(bookId: string) {
    setPage({ name: 'book', bookId });
  }

  function handleNavigate(target: 'home' | 'library' | 'favorites' | 'free-books' | 'recently-viewed' | 'my-reviews') {
    if (target === 'library') {
      setPage({ name: 'home' });
      setTimeout(() => {
        document.getElementById('books')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (target === 'home') {
      setPage({ name: 'home' });
    } else {
      setPage({ name: target });
    }
  }

  function goHome() {
    setPage({ name: 'home' });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onBookClick={handleBookClick}
        onOpenAuth={openAuth}
        onNavigate={handleNavigate}
        currentPage={page.name}
      />

      <main className="flex-1">
        {page.name === 'home' && (
          <Home
            onBookClick={handleBookClick}
            onOpenAuth={openAuth}
            onNavigate={handleNavigate}
          />
        )}
        {page.name === 'book' && (
          <BookDetail
            bookId={page.bookId}
            onBack={goHome}
            onOpenAuth={openAuth}
          />
        )}
        {page.name === 'favorites' && (
          <FavoritesPage
            onBack={goHome}
            onBookClick={handleBookClick}
            onOpenAuth={openAuth}
          />
        )}
        {page.name === 'free-books' && (
          <FreeBooksPage
            onBack={goHome}
            onBookClick={handleBookClick}
          />
        )}
        {page.name === 'recently-viewed' && (
          <RecentlyViewedPage
            onBack={goHome}
            onBookClick={handleBookClick}
            onOpenAuth={openAuth}
          />
        )}
        {page.name === 'my-reviews' && (
          <MyReviewsPage
            onBack={goHome}
            onBookClick={handleBookClickById}
            onOpenAuth={openAuth}
          />
        )}
      </main>

      <Footer />

      {authModal.open && (
        <AuthModal
          isOpen
          initialMode={authModal.mode}
          onClose={closeAuth}
        />
      )}

      {isPasswordRecovery && (
        <AuthModal
          isOpen
          initialMode="set-password"
          onClose={clearPasswordRecovery}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </LanguageProvider>
  );
}
