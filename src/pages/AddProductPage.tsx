import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Store {
  id: string;
  name: string | null;
  slug: string;
}

interface Category {
  id: string;
  slug: string;
  icon: string;
}

interface AddProductPageProps {
  selectedStore: Store;
}

const AddProductPage = () => {
  const context = useOutletContext<AddProductPageProps>();
  const selectedStore = context?.selectedStore;
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    slug: '',
    price: '',
    originalPrice: '',
    stock: '',
    categoryId: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    // check for edit id in query params
    const id = searchParams.get('id');
    if (id) {
      (async () => {
        try {
          const { data, error } = await (supabase as any)
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          if (data) {
            setEditingId(id);
            setFormData({
              slug: data.slug || '',
              price: String(data.price || ''),
              originalPrice: String(data.original_price || ''),
              stock: String(data.stock || ''),
              categoryId: data.category_id || '',
            });
            if (data.gallery_urls && Array.isArray(data.gallery_urls)) {
              setUploadedImages(data.gallery_urls.filter(Boolean));
            } else if (data.image_url) {
              setUploadedImages([data.image_url]);
            }
          }
        } catch (err: any) {
          console.error('Failed to load product for edit', err.message || err);
        }
      })();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('categories')
        .select('id, slug, icon')
        .order('slug', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB per image)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be less than 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadingIndex(index);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      // Upload to product-images bucket with user folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${index}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Add URL to array at the specific index
      const newImages = [...uploadedImages];
      newImages[index] = data.publicUrl;
      setUploadedImages(newImages);
      
      toast({ title: 'Success', description: `Image ${index + 1} uploaded!` });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: 'Error', description: err.message || 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadingIndex(null);
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStore?.id) {
      toast({ title: 'Error', description: 'No store selected', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        const { error } = await (supabase as any).from('products').update({
        store_id: selectedStore.id,
        category_id: formData.categoryId || null,
        slug: formData.slug || 'product-' + Date.now(),
        price: parseFloat(formData.price) || 0,
        original_price: parseFloat(formData.originalPrice) || 0,
        stock: parseInt(formData.stock) || 0,
          gallery_urls: uploadedImages.length > 0 ? uploadedImages : null,
        }).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('products').insert({
          store_id: selectedStore.id,
          category_id: formData.categoryId || null,
          slug: formData.slug || 'product-' + Date.now(),
          price: parseFloat(formData.price) || 0,
          original_price: parseFloat(formData.originalPrice) || 0,
          stock: parseInt(formData.stock) || 0,
          gallery_urls: uploadedImages.length > 0 ? uploadedImages : null,
        });
        if (error) throw error;
      }

      toast({ title: 'Success', description: editingId ? 'Product updated successfully!' : 'Product added successfully!' });
      setFormData({ slug: '', price: '', originalPrice: '', stock: '', categoryId: '' });
      setUploadedImages([]);
      if (editingId) {
        // after editing, go back to manage products
        navigate('/seller/manage-product');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className={`px-8 py-8 ${isRTL ? 'text-right ml-auto' : 'text-left'}`} style={{ maxWidth: '1280px' }}>
          <h1 className="text-3xl font-bold text-gray-900">Add New Products</h1>
          <p className={`text-gray-600 text-sm mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>Add products to your store: <span className="font-semibold">{selectedStore?.name || selectedStore?.slug}</span></p>
        </div>
      </div>

      {/* Main Content */}
      <div className={`px-8 py-8 ${isRTL ? 'text-right ml-auto' : 'text-left'}`} style={{ maxWidth: '1280px' }}>
        {/* Product Image Section - Full Width */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Image</h2>
          <div className="grid grid-cols-4 gap-6">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="flex flex-col items-center">
                {uploadedImages[index] ? (
                  <div className="relative w-full aspect-square group">
                    <img 
                      src={uploadedImages[index]} 
                      alt={`Product ${index + 1}`} 
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-red-500 text-white p-2 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-md`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {uploadingIndex === index && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                          <span className="text-white text-xs font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 font-medium">Click to upload product image</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, index)}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">You can upload up to 4 images, 10MB each</p>
        </div>

        {/* Product Information Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Information</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>Product Name *</label>
              <Input
                placeholder="Enter product name"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={5}
                placeholder="Enter product description"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Price and Offer Price */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>Actual Price ($) *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>Offer Price ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  step="0.01"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>Select a category</label>
              <select 
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Choose Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>Stock *</label>
              <Input
                type="number"
                placeholder="0"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading} 
              className={`bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg inline-flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className="h-4 w-4" />
              <span className={isRTL ? 'mr-2' : 'ml-2'}>
                {loading ? 'Adding Product...' : 'Add Product'}
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductPage;
