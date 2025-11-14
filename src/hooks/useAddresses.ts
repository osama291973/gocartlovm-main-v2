/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Address {
  id: string;
  user_id: string;
  title: string;
  street: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useAddresses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's addresses
  const { data: addresses = [], isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get default address
  const defaultAddress = addresses.find((addr) => addr.is_default);

  // Create address
  const createAddress = useMutation({
    mutationFn: async (params: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // If this is the first address or marked as default, make it default
      const isFirstAddress = addresses.length === 0;
      const shouldBeDefault = params.is_default || isFirstAddress;

      // If making this default, unset others
      if (shouldBeDefault && defaultAddress) {
        const client = supabase.from('addresses') as any;
        await client
          .update({ is_default: false })
          .eq('id', defaultAddress.id);
      }

      const client = supabase.from('addresses') as any;
      const { data, error } = await client
        .insert({
          user_id: user.id,
          ...params,
          is_default: shouldBeDefault,
        })
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
    },
  });

  // Update address
  const updateAddress = useMutation({
    mutationFn: async (params: { addressId: string } & Partial<Address>) => {
      const { addressId, ...updates } = params;

      // If making this default, unset others
      if (updates.is_default && defaultAddress?.id !== addressId) {
        const client = supabase.from('addresses') as any;
        await client
          .update({ is_default: false })
          .eq('id', defaultAddress?.id);
      }

      const client = supabase.from('addresses') as any;
      const { error } = await client
        .update(updates)
        .eq('id', addressId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
    },
  });

  // Delete address
  const deleteAddress = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
    },
  });

  // Set default address
  const setDefaultAddress = useMutation({
    mutationFn: async (addressId: string) => {
      if (defaultAddress?.id) {
        const client = supabase.from('addresses') as any;
        await client
          .update({ is_default: false })
          .eq('id', defaultAddress.id);
      }

      const client = supabase.from('addresses') as any;
      const { error } = await client
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
    },
  });

  return {
    addresses,
    defaultAddress,
    isLoadingAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
};
