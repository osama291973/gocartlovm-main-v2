import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Eye } from 'lucide-react';

interface Store {
  id: string;
  name: string | null;
  slug: string;
}

interface ManageProductPageProps {
  selectedStore: Store;
}

const ManageProductPage = () => {
  const context = useOutletContext<ManageProductPageProps>();
  const selectedStore = context?.selectedStore;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch store products
  const { data: products = [] } = useQuery({
    queryKey: ['store-products', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('store_id', selectedStore.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStore?.id,
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Manage Products</h1>
        <p className="text-muted-foreground">
          Store: <span className="font-semibold">{selectedStore?.name || selectedStore?.slug}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No products yet</p>
              <p className="text-sm text-muted-foreground">Start by adding your first product</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Price</th>
                    <th className="text-left py-3 px-4 font-semibold">Stock</th>
                    <th className="text-left py-3 px-4 font-semibold">Rating</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {(product.image_url || (product.gallery_urls && product.gallery_urls[0])) && (
                            <img
                              src={product.image_url || (product.gallery_urls && product.gallery_urls[0])}
                              alt={product.slug}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name || product.slug}</div>
                            <div className="text-xs text-muted-foreground">{product.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">${Number(product.price).toFixed(2)}</div>
                        {product.original_price && (
                          <div className="text-xs text-muted-foreground line-through">
                            ${Number(product.original_price).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          product.stock > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {product.rating ? (
                            <>
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1">{Number(product.rating).toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({product.reviews_count})
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">No reviews</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/seller/add-product?id=${product.id}`)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/product/${product.slug}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={async () => {
                              if (!confirm('Delete this product?')) return;
                              try {
                                const { error } = await (supabase as any)
                                  .from('products')
                                  .delete()
                                  .eq('id', product.id);
                                if (error) throw error;
                                // invalidate query to refresh list
                                queryClient.invalidateQueries({ queryKey: ['store-products', selectedStore?.id] });
                              } catch (err: any) {
                                console.error('Delete product error', err.message || err);
                                alert('Failed to delete product');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageProductPage;
