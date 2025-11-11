import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AdminCoupons = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('admin'))) {
      navigate('/auth');
    }
  }, [user, hasRole, authLoading, navigate]);

  const { data: coupons, isLoading, refetch } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && hasRole('admin'),
  });

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
  const { error } = await (supabase as any).from('coupons').update({ is_active: !isActive, updated_at: new Date() }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated', description: 'Coupon updated.' });
      refetch();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to update coupon', variant: 'destructive' });
    }
  };

  if (authLoading || isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      {/* Header with Logo Text */}
      <div className="mb-8">
        <a href="/" className="inline-flex items-center mb-4 text-2xl font-semibold">
          <span className="text-green-600">go</span><span className="text-black">cart</span>
        </a>
        <h1 className="text-3xl font-bold">Coupons</h1>
      </div>
      <div className="space-y-4">
        {coupons?.length === 0 ? (
          <p className="text-muted-foreground">No coupons found</p>
        ) : (
          coupons?.map((c: any) => (
            <Card key={c.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.code}</div>
                <div className="text-sm text-muted-foreground">{c.discount_type} - {c.discount_value}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleToggleActive(c.id, c.is_active)}>{c.is_active ? 'Disable' : 'Enable'}</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
