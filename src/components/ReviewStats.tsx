import { Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReviewStatsProps {
  averageRating: string | number;
  ratingDistribution: Record<number, number>;
  totalReviews: number;
}

export const ReviewStats = ({
  averageRating,
  ratingDistribution,
  totalReviews,
}: ReviewStatsProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-muted/30 rounded-lg p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{averageRating}</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(Number(averageRating))
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-muted text-muted'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingDistribution[rating];
          const percentage =
            totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
