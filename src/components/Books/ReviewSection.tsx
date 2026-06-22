import { useState, useEffect } from 'react';
import { Send, Loader2, User } from 'lucide-react';
import StarRating from './StarRating';
import { supabase, type Review } from '../../lib/supabase';
import { useLang } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

type ReviewSectionProps = {
  bookId: string;
  onOpenAuth: (mode: 'login' | 'signup') => void;
};

export default function ReviewSection({ bookId, onOpenAuth }: ReviewSectionProps) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);

  async function fetchReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });
    if (error) console.error('fetchReviews error:', error);
    if (data) {
      setReviews(data as Review[]);
      if (user) {
        const own = (data as Review[]).find(r => r.user_id === user.id) ?? null;
        if (own) {
          setUserReview(own);
          setUserRating(own.rating);
          setComment(own.comment ?? '');
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchReviews();
  }, [bookId, user]);

  async function handleSubmit() {
    if (!user) return;
    if (userRating === 0) return;
    setSubmitting(true);
    setSubmitMsg('');

    if (userReview) {
      await supabase
        .from('reviews')
        .update({ rating: userRating, comment })
        .eq('id', userReview.id);
    } else {
      await supabase.from('reviews').insert({
        book_id: bookId,
        user_id: user.id,
        rating: userRating,
        comment,
      });
    }

    setSubmitting(false);
    setSubmitMsg(t.book.review_submitted);
    await fetchReviews();
    setTimeout(() => setSubmitMsg(''), 3000);
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="mt-10">
      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-amber-600">{avgRating.toFixed(1)}</div>
            <div className="text-stone-400 text-xs mt-1">/ 5</div>
          </div>
          <div className="flex-1">
            <StarRating rating={avgRating} size="lg" />
            <p className="text-stone-500 text-sm mt-2">
              {t.book.based_on} {reviews.length} {t.book.people}
            </p>
          </div>
        </div>
      )}

      {/* Write Review */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-stone-800 mb-4">
          {userReview ? t.book.update_review : t.book.write_review}
        </h3>

        {!user ? (
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center">
            <p className="text-stone-500 text-sm mb-4">{t.book.login_prompt}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-5 py-2 border border-amber-400 text-amber-600 text-sm font-semibold rounded-full hover:bg-amber-50 transition-colors"
              >
                {t.auth.login}
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-full hover:bg-amber-400 transition-colors"
              >
                {t.auth.signup}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-stone-600 mb-2">{t.book.your_rating}</p>
              <StarRating
                rating={userRating}
                size="lg"
                interactive
                onRate={setUserRating}
              />
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t.book.your_comment}
              rows={3}
              dir={t.dir}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              {submitMsg ? (
                <span className="text-emerald-600 text-sm font-medium">{submitMsg}</span>
              ) : <span />}
              <button
                onClick={handleSubmit}
                disabled={submitting || userRating === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {userReview ? t.book.update_review : t.book.submit_review}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
          {t.book.all_reviews}
          {reviews.length > 0 && (
            <span className="text-sm font-normal text-stone-400">({reviews.length})</span>
          )}
        </h3>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-stone-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-stone-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-stone-400 text-sm py-6 text-center">{t.book.no_reviews}</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div
                key={review.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm ${
                  user && review.user_id === user.id ? 'border-amber-200 bg-amber-50/30' : 'border-stone-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">
                        {review.profiles?.username || t.book.anonymous}
                      </p>
                      <p className="text-xs text-stone-400">
                        {new Date(review.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm text-stone-600 leading-relaxed" dir={t.dir}>
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
