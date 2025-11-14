/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export const useReviews = (productId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch product reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await (supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  // Fetch user's review for a product
  const { data: userReview } = useQuery({
    queryKey: ['userReview', productId, user?.id],
    queryFn: async () => {
      if (!productId || !user?.id) return null;

      const { data, error } = await (supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle() as any);

      if (error) throw error;
      return data;
    },
    enabled: !!productId && !!user?.id,
  });

  // Create review
  const createReview = useMutation({
    mutationFn: async (params: {
      product_id: string;
      rating: number;
      title: string;
      comment: string;
      verified_purchase?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if user already reviewed this product
      const { data: existingReview } = await (supabase
        .from('reviews')
        .select('id')
        .eq('product_id', params.product_id)
        .eq('user_id', user.id)
        .maybeSingle() as any);

      if (existingReview) {
        throw new Error('You have already reviewed this product');
      }

      const client = supabase.from('reviews') as any;
      const { data, error } = await client
        .insert({
          product_id: params.product_id,
          user_id: user.id,
          rating: params.rating,
          title: params.title,
          comment: params.comment,
          verified_purchase: params.verified_purchase || false,
          helpful_count: 0,
        })
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.product_id] });
      queryClient.invalidateQueries({
        queryKey: ['userReview', variables.product_id, user?.id],
      });
      // Also invalidate product to update review count
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Update review
  const updateReview = useMutation({
    mutationFn: async (params: {
      reviewId: string;
      rating?: number;
      title?: string;
      comment?: string;
    }) => {
      const client = supabase.from('reviews') as any;
      const { error } = await client
        .update({
          ...(params.rating !== undefined && { rating: params.rating }),
          ...(params.title && { title: params.title }),
          ...(params.comment && { comment: params.comment }),
        })
        .eq('id', params.reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['userReview'] });
    },
  });

  // Delete review
  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['userReview'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Mark review as helpful
  const markAsHelpful = useMutation({
    mutationFn: async (reviewId: string) => {
      const client = supabase.from('reviews') as any;
      const { data: review } = await client
        .select('helpful_count')
        .eq('id', reviewId)
        .maybeSingle();

      if (!review) throw new Error('Review not found');

      const { error } = await client
        .update({ helpful_count: (review.helpful_count || 0) + 1 })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  // Calculate stats
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return {
    reviews,
    userReview,
    isLoadingReviews,
    createReview,
    updateReview,
    deleteReview,
    markAsHelpful,
    averageRating,
    ratingDistribution,
  };
};
