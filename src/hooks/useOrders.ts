/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  address_id: string;
  status: string;
  total_amount: number;
  payment_status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: any[];
  address?: any;
  store?: any;
}

export const useOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create new order
  const createOrder = useMutation({
    mutationFn: async (params: {
      store_id: string;
      address_id: string;
      total_amount: number;
      payment_status?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const client = supabase.from('orders') as any;
      const { data, error } = await client
        .insert({
          user_id: user.id,
          store_id: params.store_id,
          address_id: params.address_id,
          total_amount: params.total_amount,
          status: 'pending',
          payment_status: params.payment_status || 'pending',
          notes: params.notes,
        })
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });

  // Update order status
  const updateOrderStatus = useMutation({
    mutationFn: async (params: { orderId: string; status: string }) => {
      const client = supabase.from('orders') as any;
      const { error } = await client
        .update({ status: params.status })
        .eq('id', params.orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });

  // Update payment status
  const updatePaymentStatus = useMutation({
    mutationFn: async (params: { orderId: string; paymentStatus: string }) => {
      const client = supabase.from('orders') as any;
      const { error } = await client
        .update({ payment_status: params.paymentStatus })
        .eq('id', params.orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });

  return {
    orders,
    isLoadingOrders,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
  };
};
