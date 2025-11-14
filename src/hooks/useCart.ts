/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    slug: string;
    stock: number;
    price: number;
  };
  variant?: {
    id: string;
    sku: string;
    price: number;
    stock: number;
  };
}

export const useCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('cart_items')
        .select(
          `
          id,
          user_id,
          product_id,
          variant_id,
          quantity,
          created_at,
          updated_at,
          product:products(id, slug, stock, price),
          variant:product_variants(id, sku, price, stock)
        `
        ) as any);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Add to cart
  const addToCart = useMutation({
    mutationFn: async (params: {
      product_id: string;
      variant_id: string;
      quantity: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if item already in cart
      const { data: existingItems } = await (supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', params.product_id)
        .eq('variant_id', params.variant_id) as any);

      const existingItem = existingItems?.[0];

      if (existingItem) {
        // Update quantity
        const client = supabase.from('cart_items') as any;
        const { error } = await client
          .update({ quantity: existingItem.quantity + params.quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
        return existingItem;
      } else {
        // Insert new item
        const client = supabase.from('cart_items') as any;
        const { data, error } = await client
          .insert({
            user_id: user.id,
            product_id: params.product_id,
            variant_id: params.variant_id,
            quantity: params.quantity,
          })
          .select();

        if (error) throw error;
        return data?.[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  // Update cart item quantity
  const updateQuantity = useMutation({
    mutationFn: async (params: { cartItemId: string; quantity: number }) => {
      if (params.quantity <= 0) {
        // Delete if quantity is 0 or less
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', params.cartItemId);

        if (error) throw error;
      } else {
        const client = supabase.from('cart_items') as any;
        const { error } = await client
          .update({ quantity: params.quantity })
          .eq('id', params.cartItemId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  // Remove from cart
  const removeFromCart = useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  // Clear cart
  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  // Calculate totals
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.variant?.price || item.product?.price || 0;
    return total + price * item.quantity;
  }, 0);

  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return {
    cartItems,
    isLoadingCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    itemCount,
  };
};
