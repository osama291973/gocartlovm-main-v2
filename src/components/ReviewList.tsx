import { Star, ThumbsUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Review } from '@/hooks/useReviews';

interface ReviewListProps {
  reviews: Review[];
  onDelete?: (reviewId: string) => void;
  onMarkHelpful?: (reviewId: string) => void;
  isDeleting?: boolean;
}

export const ReviewList = ({
  reviews,
  onDelete,
  onMarkHelpful,
  isDeleting,
}: ReviewListProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('noReviews')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4 hover:bg-muted/50">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {/* Rating Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-muted text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-sm">{review.rating}</span>
              </div>
              <h4 className="font-semibold text-sm mb-1">{review.title}</h4>
              <p className="text-xs text-muted-foreground">
                By{' '}
                {review.user?.user_metadata?.full_name ||
                  review.user?.email?.split('@')[0] ||
                  'Anonymous'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Delete Button */}
            {user?.id === review.user_id && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(review.id)}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Verified Badge */}
          {review.verified_purchase && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                ✓ {t('verifiedPurchase')}
              </span>
            </div>
          )}

          {/* Comment */}
          <p className="text-sm text-foreground mb-3 leading-relaxed">{review.comment}</p>

          {/* Helpful Footer */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onMarkHelpful?.(review.id);
                toast({
                  title: 'Thanks!',
                  description: 'Your feedback is appreciated',
                });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">{review.helpful_count}</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              {review.helpful_count === 1
                ? '1 person found this helpful'
                : `${review.helpful_count} people found this helpful`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
