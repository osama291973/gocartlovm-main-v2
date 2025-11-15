/**
 * useCoupons Hook
 * 
 * This hook provides all coupon-related operations for the frontend:
 * - Fetch active coupons
 * - Validate coupon code
 * - Calculate discount amount
 * - Check coupon eligibility
 * 
 * @example
 * const { getCouponByCode, validateCoupon, calculateDiscount } = useCoupons();
 * const coupon = await getCouponByCode('SUMMER20');
 * const isValid = await validateCoupon(coupon.id, subtotal);
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number | null;
  max_discount: number | null;
  expire_at: string;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  coupon?: Coupon;
}

export interface DiscountResult {
  discountAmount: number;
  finalTotal: number;
  coupon: Coupon;
}

/**
 * Validate if a coupon code exists and is active
 */
const validateCouponCode = async (code: string): Promise<CouponValidationResult> => {
  try {
    const { data, error } = await (supabase as any)
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { isValid: false, error: 'Coupon not found' };
    }

    // Check if expired
    const now = new Date();
    const expireAt = new Date(data.expire_at);
    if (now > expireAt) {
      return { isValid: false, error: 'Coupon has expired' };
    }

    // Check if usage limit reached
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      return { isValid: false, error: 'Coupon usage limit reached' };
    }

    return { isValid: true, coupon: data };
  } catch (err) {
    console.error('Error validating coupon:', err);
    return { isValid: false, error: 'Error validating coupon' };
  }
};

/**
 * Check if subtotal meets minimum purchase requirement
 */
const checkMinimumPurchase = (coupon: Coupon, subtotal: number): boolean => {
  if (!coupon.min_purchase) return true;
  return subtotal >= coupon.min_purchase;
};

/**
 * Calculate discount amount based on coupon
 */
const calculateDiscountAmount = (coupon: Coupon, subtotal: number): number => {
  if (coupon.discount_type === 'percentage') {
    const discount = (subtotal * coupon.discount_value) / 100;
    // Apply max discount cap if exists
    if (coupon.max_discount) {
      return Math.min(discount, coupon.max_discount);
    }
    return discount;
  } else {
    // Fixed amount discount
    return coupon.discount_value;
  }
};

/**
 * Main hook for coupon operations
 */
export const useCoupons = () => {
  /**
   * Fetch a specific coupon by code
   */
  const getCouponByCode = useMutation({
    mutationFn: async (code: string) => {
      return validateCouponCode(code);
    },
  });

  /**
   * Validate coupon eligibility for a given subtotal
   */
  const validateCoupon = async (
    coupon: Coupon,
    subtotal: number
  ): Promise<CouponValidationResult> => {
    try {
      // Check minimum purchase
      if (!checkMinimumPurchase(coupon, subtotal)) {
        return {
          isValid: false,
          error: `Minimum purchase of ${coupon.min_purchase} required`,
          coupon,
        };
      }

      return { isValid: true, coupon };
    } catch (err) {
      console.error('Error validating coupon eligibility:', err);
      return { isValid: false, error: 'Error validating coupon' };
    }
  };

  /**
   * Calculate final total after applying coupon discount
   */
  const calculateDiscount = async (
    coupon: Coupon,
    subtotal: number
  ): Promise<DiscountResult | null> => {
    try {
      const discountAmount = calculateDiscountAmount(coupon, subtotal);
      const finalTotal = Math.max(0, subtotal - discountAmount);

      return {
        discountAmount,
        finalTotal,
        coupon,
      };
    } catch (err) {
      console.error('Error calculating discount:', err);
      return null;
    }
  };

  /**
   * Fetch all active coupons (for admin view)
   */
  const { data: allCoupons, isLoading: loadingCoupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  /**
   * Fetch all coupons including inactive (for admin)
   */
  const { data: adminCoupons, isLoading: loadingAdminCoupons } = useQuery({
    queryKey: ['coupons-admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return {
    // Mutations
    getCouponByCode,

    // Functions
    validateCoupon,
    calculateDiscount,
    calculateDiscountAmount,
    checkMinimumPurchase,

    // Data
    allCoupons: (allCoupons || []) as Coupon[],
    adminCoupons: (adminCoupons || []) as Coupon[],
    loadingCoupons,
    loadingAdminCoupons,
  };
};

export default useCoupons;
