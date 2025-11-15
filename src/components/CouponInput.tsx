/**
 * CouponInput Component
 * 
 * Allows customers to enter and apply coupon codes during checkout
 * Displays discount amount and validates coupon eligibility
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCoupons } from '@/hooks/useCoupons';
import { useToast } from '@/hooks/use-toast';
import { X, Check } from 'lucide-react';

interface CouponInputProps {
  subtotal: number;
  onApplySuccess?: (coupon: any, discount: number) => void;
  onRemove?: () => void;
  appliedCoupon?: any;
}

export const CouponInput = ({
  subtotal,
  onApplySuccess,
  onRemove,
  appliedCoupon,
}: CouponInputProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getCouponByCode, calculateDiscount, validateCoupon } = useCoupons();
  const { toast } = useToast();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Get coupon by code
      const validationResult = await getCouponByCode.mutateAsync(couponCode);

      if (!validationResult.isValid || !validationResult.coupon) {
        toast({
          title: 'Invalid Coupon',
          description: validationResult.error || 'Coupon not found',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Validate eligibility
      const coupon = validationResult.coupon;
      const eligibilityResult = await validateCoupon(coupon, subtotal);

      if (!eligibilityResult.isValid) {
        toast({
          title: 'Coupon Not Eligible',
          description: eligibilityResult.error || 'This coupon cannot be applied',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Step 3: Calculate discount
      const discountResult = await calculateDiscount(coupon, subtotal);

      if (!discountResult) {
        toast({
          title: 'Error',
          description: 'Could not calculate discount',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Success
      toast({
        title: 'Coupon Applied!',
        description: `You saved $${discountResult.discountAmount.toFixed(2)}`,
      });

      setCouponCode('');
      onApplySuccess?.(coupon, discountResult.discountAmount);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply coupon',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Coupon Applied</p>
            <p className="text-sm text-green-700">{appliedCoupon.code}</p>
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-green-600 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleApplyCoupon} className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={isLoading || !couponCode.trim()}
        >
          {isLoading ? 'Applying...' : 'Apply'}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Have a coupon code? Enter it above to see your savings.
      </p>
    </form>
  );
};

export default CouponInput;
