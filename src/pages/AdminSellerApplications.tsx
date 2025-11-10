import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SellerApplication {
  id: string;
  user_id: string;
  store_id: string;
  status: string;
  created_at: string;
  store: {
    slug: string;
    translations: {
      name: string;
      description: string;
      language_code: string;
    }[];
  };
}

const AdminSellerApplications = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('admin'))) {
      navigate('/auth');
    }
  }, [user, hasRole, authLoading, navigate]);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['seller-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_applications')
        .select(`
          *,
          store:stores (
            slug,
            translations:store_translations (
              name,
              description,
              language_code
            )
            )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SellerApplication[];
    },
    enabled: !!user && hasRole('admin'),
  });

  const handleApprove = async (application: SellerApplication) => {
    try {
      // Try RPC using common parameter names. Some DBs expose the function
      // as approve_seller_application(application_id uuid) while others use
      // approve_seller_application(target_user_id uuid). Attempt both to be
      // resilient to migrations applied in different orders.
      let res: any;
      res = await (supabase as any).rpc('approve_seller_application', { application_id: application.id });
      if (res?.error) {
        // If function not found or param mismatch, try alternative param
        res = await (supabase as any).rpc('approve_seller_application', { target_user_id: application.user_id });
      }

      if (res?.error) throw res.error;

      toast({
        title: 'Application Approved',
        description: 'The seller application has been approved.',
      });

      // Refresh the applications list
      queryClient.invalidateQueries({ queryKey: ['seller-applications'] });
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve application',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (application: SellerApplication) => {
    try {
      // Try both parameter names as with approve
      let res: any;
      res = await (supabase as any).rpc('reject_seller_application', { application_id: application.id });
      if (res?.error) {
        res = await (supabase as any).rpc('reject_seller_application', { target_user_id: application.user_id });
      }

      if (res?.error) throw res.error;

      toast({
        title: 'Application Rejected',
        description: 'The seller application has been rejected.',
      });

      queryClient.invalidateQueries({ queryKey: ['seller-applications'] });
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject application',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Pending Seller Applications</h1>

      <div className="space-y-4">
        {applications?.length === 0 ? (
          <p className="text-muted-foreground">No pending applications</p>
        ) : (
          applications?.map((application) => {
            const englishTranslation = application.store.translations.find(
              (t) => t.language_code === 'en'
            );
            const arabicTranslation = application.store.translations.find(
              (t) => t.language_code === 'ar'
            );

            return (
              <Card key={application.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {englishTranslation?.name || arabicTranslation?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Submitted by: {application.user_id}
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">English Details:</h4>
                      <p>{englishTranslation?.description || 'No English description'}</p>
                      
                      <h4 className="font-medium">Arabic Details:</h4>
                      <p dir="rtl">{arabicTranslation?.description || 'No Arabic description'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleApprove(application)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(application)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminSellerApplications;