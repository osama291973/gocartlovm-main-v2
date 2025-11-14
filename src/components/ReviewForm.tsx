import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  onSubmit: (data: {
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  isLoading?: boolean;
  isEditing?: boolean;
  initialData?: {
    rating?: number;
    title?: string;
    comment?: string;
  };
}

export const ReviewForm = ({
  onSubmit,
  isLoading,
  isEditing,
  initialData,
}: ReviewFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [rating, setRating] = useState(initialData?.rating || 0);
  const [title, setTitle] = useState(initialData?.title || '');
  const [comment, setComment] = useState(initialData?.comment || '');

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Error',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a review title',
        variant: 'destructive',
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your review',
        variant: 'destructive',
      });
      return;
    }

    if (comment.length < 10) {
      toast({
        title: 'Error',
        description: 'Review must be at least 10 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit({
        rating,
        title,
        comment,
      });

      toast({
        title: 'Success',
        description: isEditing
          ? 'Review updated successfully'
          : 'Review submitted successfully',
      });

      if (!isEditing) {
        setRating(0);
        setTitle('');
        setComment('');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-muted/30">
      <h3 className="text-lg font-semibold mb-4">
        {isEditing ? t('editReview') : t('writeReview')}
      </h3>

      <div className="space-y-4">
        {/* Rating */}
        <div>
          <Label className="mb-2">{t('rating')}</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-muted text-muted'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {rating === 1
                ? 'Poor'
                : rating === 2
                  ? 'Fair'
                  : rating === 3
                    ? 'Good'
                    : rating === 4
                      ? 'Very Good'
                      : 'Excellent'}
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title" className="mb-2">
            {t('reviewTitle')}
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Amazing product!"
            disabled={isLoading}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {title.length}/100
          </p>
        </div>

        {/* Comment */}
        <div>
          <Label htmlFor="comment" className="mb-2">
            {t('reviewComment')}
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            disabled={isLoading}
            rows={5}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length}/1000
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || rating === 0 || !title.trim() || !comment.trim()}
          className="w-full"
        >
          {isLoading
            ? isEditing
              ? 'Updating...'
              : 'Submitting...'
            : isEditing
              ? 'Update Review'
              : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
};
