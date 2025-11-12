import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Store {
  id: string;
  name: string | null;
  slug: string;
}

interface AddProductPageProps {
  selectedStore: Store;
}

const AddProductPage = () => {
  const context = useOutletContext<AddProductPageProps>();
  const selectedStore = context?.selectedStore;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    price: '',
    originalPrice: '',
    stock: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStore?.id) {
      toast({ title: 'Error', description: 'No store selected', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await (supabase as any).from('products').insert({
        store_id: selectedStore.id,
        slug: formData.slug || 'product-' + Date.now(),
        price: parseFloat(formData.price) || 0,
        original_price: parseFloat(formData.originalPrice) || 0,
        stock: parseInt(formData.stock) || 0,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Product added successfully!' });
      setFormData({ slug: '', price: '', originalPrice: '', stock: '' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Add New Products</h1>
        <p className="text-muted-foreground">
          Add products to your store: <span className="font-semibold">{selectedStore?.name || selectedStore?.slug}</span>
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Image {i}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <Input
                  placeholder="Enter product name"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={4}
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Actual Price ($) *</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Offer Price ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select a category</label>
                <select className="w-full border rounded-lg p-2 text-sm">
                  <option>Choose Category</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock *</label>
                <Input
                  type="number"
                  placeholder="0"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Adding Product...' : 'Add Product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProductPage;
