import React, { useState } from 'react';
import { useCreateProduct } from '@/hooks/useCreateProduct';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

/**
 * Demo page showing how to use the useCreateProduct hook.
 * This is a minimal example for testing the product + translations creation flow.
 * 
 * Usage: Add a route to this page in your router and visit it to test.
 * Example: /test-product-create
 */
export function TestProductCreatePage() {
  const { createProduct, isLoading, error } = useCreateProduct();
  
  const [formData, setFormData] = useState({
    slug: 'test-product-' + Date.now(),
    storeId: '', // You'll need to provide a valid store_id
    price: 99.99,
    stock: 10,
    imageUrl: '',
    enName: 'Test Product',
    enDesc: 'Test product description in English',
    arName: 'منتج الاختبار',
    arDesc: 'وصف المنتج في اللغة العربية',
  });

  const [result, setResult] = useState<{ product_id?: string; error?: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    // Validate store_id
    if (!formData.storeId.trim()) {
      setResult({ error: 'Please provide a valid store_id' });
      return;
    }

    const productResult = await createProduct(
      {
        store_id: formData.storeId,
        slug: formData.slug,
        price: parseFloat(String(formData.price)),
        stock: parseInt(String(formData.stock), 10),
        image_url: formData.imageUrl || null,
      },
      [
        {
          language_code: 'en',
          name: formData.enName,
          description: formData.enDesc,
        },
        {
          language_code: 'ar',
          name: formData.arName,
          description: formData.arDesc,
        },
      ]
    );

    setResult(productResult);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Product Creation</CardTitle>
          <CardDescription>
            Create a product with English and Arabic translations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Store ID (UUID)*</label>
              <Input
                name="storeId"
                placeholder="e.g., a9bc0920-2cbe-4776-bbe9-38abd53443bc"
                value={formData.storeId}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use your seller/store UUID. You can find this in your products list.
              </p>
            </div>

            {/* Product Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <Input
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <Input
                  name="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* English Translation */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">English (EN)</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  name="enName"
                  value={formData.enName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  name="enDesc"
                  value={formData.enDesc}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Arabic Translation */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Arabic (AR)</h3>
              <div>
                <label className="block text-sm font-medium mb-2">الاسم</label>
                <Input
                  name="arName"
                  value={formData.arName}
                  onChange={handleInputChange}
                  dir="rtl"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">الوصف</label>
                <Textarea
                  name="arDesc"
                  value={formData.arDesc}
                  onChange={handleInputChange}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                Error: {error}
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className={`px-4 py-3 rounded border ${
                result.product_id
                  ? 'bg-green-100 border-green-400 text-green-700'
                  : 'bg-red-100 border-red-400 text-red-700'
              }`}>
                {result.product_id ? (
                  <>
                    <p className="font-semibold">✓ Success!</p>
                    <p className="text-sm mt-1">Product ID: {result.product_id}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">✗ Failed</p>
                    <p className="text-sm mt-1">{result.error}</p>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResult(null)}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default TestProductCreatePage;
