import { Star } from 'lucide-react';

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
};

export default function StarRating({
  rating,
  max = 5,
  size = 'sm',
  interactive = false,
  onRate,
}: StarRatingProps) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const cls = sizes[size];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(i + 1)}
            className={`transition-transform ${interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`${cls} transition-colors ${
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : half
                  ? 'fill-amber-200 text-amber-400'
                  : 'fill-none text-stone-300'
              } ${interactive && !filled ? 'hover:fill-amber-300 hover:text-amber-300' : ''}`}
            />
          </button>
        );
      })}
    </div>
  );
}
