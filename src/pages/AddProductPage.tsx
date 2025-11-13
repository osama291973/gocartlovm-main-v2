import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateProduct } from '@/hooks/useCreateProduct';
import { useTranslationMutations } from '@/hooks/useTranslationMutations';
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
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  
  // Hooks
  const { createProduct, isLoading: isCreatingProduct, error: createError } = useCreateProduct();
  const { upsertTranslations } = useTranslationMutations();

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
    description: '', // Generic description field (will be mapped to primary language)
    enName: '',
    enDescription: '',
    arName: '',
    arDescription: '',
  });

  // Show the other-language translation inputs only when seller requests it
  const [showOtherTranslations, setShowOtherTranslations] = useState(false);
  // Placeholder for future auto-translate option (Edge Function)
  const [autoTranslate, setAutoTranslate] = useState(false);

  // Simple slugify helper and uniqueness checker to avoid duplicate-slug errors
  const slugify = (text: string) =>
    (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // replace spaces with -
      .replace(/[^a-z0-9\-]/g, '') // remove invalid chars
      .replace(/\-+/g, '-');

  const ensureUniqueSlug = async (desired: string) => {
    const base = slugify(desired || 'product');
    let attempt = base;
    let i = 1;
    try {
      while (true) {
        const { data, error } = await (supabase as any)
          .from('products')
          .select('id')
          .eq('slug', attempt)
          .limit(1);
        if (error) {
          console.error('Error checking slug uniqueness', error);
          break;
        }
        if (!data || data.length === 0) return attempt;
        attempt = `${base}-${i++}`;
        // safety cap
        if (i > 100) return `${base}-${Date.now()}`;
      }
    } catch (e) {
      console.error('ensureUniqueSlug failed', e);
    }
    return `${base}-${Date.now()}`;
  };

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
              description: data.description || '',
              enName: '',
              enDescription: '',
              arName: '',
              arDescription: '',
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

    // Validate primary language input only
    const primaryLang = language === 'ar' ? 'ar' : 'en';
    if (primaryLang === 'en' && !formData.enName) {
      toast({ title: 'Error', description: t('product_form.error.product_name_required'), variant: 'destructive' });
      return;
    }
    if (primaryLang === 'ar' && !formData.arName) {
      toast({ title: 'Error', description: t('product_form.error.product_name_required'), variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Determine if user entered in English or Arabic
      const isEnglishInput = !!formData.enName;
      const isArabicInput = !!formData.arName;

      // Build translations array - always include both languages
      let translationsToCreate: any[] = [];

      if (isEnglishInput) {
        // User entered in English - add English translation
        translationsToCreate.push({
          language_code: 'en',
          name: formData.enName,
          description: formData.enDescription || null,
        });
      }

      if (isArabicInput) {
        // User entered in Arabic - add Arabic translation
        translationsToCreate.push({
          language_code: 'ar',
          name: formData.arName,
          description: formData.arDescription || null,
        });
      }

      // Determine product description
      const productDescription = formData.description || 
        (language === 'ar' ? formData.arDescription : formData.enDescription) || 
        null;

      // Determine desired slug
      const desiredSlug = (formData.slug && formData.slug.trim()) || 
        (isEnglishInput ? formData.enName : formData.arName || 'product');
      const uniqueSlug = await ensureUniqueSlug(desiredSlug);

      if (editingId) {
        // For edit: just update product and translations
        const { error: updateError } = await (supabase as any).from('products').update({
          store_id: selectedStore.id,
          category_id: formData.categoryId || null,
          slug: formData.slug || 'product-' + Date.now(),
          price: parseFloat(formData.price) || 0,
          original_price: parseFloat(formData.originalPrice) || 0,
          stock: parseInt(formData.stock) || 0,
          gallery_urls: uploadedImages.length > 0 ? uploadedImages : null,
          description: productDescription,
        }).eq('id', editingId);
        
        if (updateError) throw updateError;

        if (translationsToCreate.length > 0) {
          const upsertRes: any = await upsertTranslations(translationsToCreate as any);
          if (upsertRes?.error) {
            throw upsertRes.error;
          }
        }

        toast({ title: 'Success', description: t('product_form.success.updated') });
        setFormData({ slug: '', price: '', originalPrice: '', stock: '', categoryId: '', description: '', enName: '', enDescription: '', arName: '', arDescription: '' });
        setUploadedImages([]);
        navigate('/seller/manage-product');
      } else {
        // For create: first create product, then create translations (with auto-translation if needed)
        const result = await createProduct(
          {
            store_id: selectedStore.id,
            category_id: formData.categoryId || null,
            slug: uniqueSlug,
            price: parseFloat(formData.price) || 0,
            original_price: parseFloat(formData.originalPrice) || 0,
            stock: parseInt(formData.stock) || 0,
            gallery_urls: uploadedImages.length > 0 ? uploadedImages : null,
            description: productDescription,
          },
          translationsToCreate
        );

        if (!result || !result.product_id) {
          throw new Error(result?.error || 'Failed to create product');
        }

        toast({ title: 'Success', description: t('product_form.success.created') });
        setFormData({ slug: '', price: '', originalPrice: '', stock: '', categoryId: '', description: '', enName: '', enDescription: '', arName: '', arDescription: '' });
        setUploadedImages([]);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      const msg = err?.message || '';
      if (msg.includes('duplicate key') || msg.includes('products_slug_key') || err?.code === '23505') {
        toast({ title: 'Error', description: t('product_form.error.slug_exists'), variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: msg || t('product_form.error.save_failed'), variant: 'destructive' });
      }
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
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('product_image.title')}</h2>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('product_info.title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Language-Specific Product Name & Description */}
            {language === 'ar' ? (
              <>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 text-right`}>{t('product_info.name.label')} {t('product_info.name.required')}</label>
                  <Input
                    placeholder={t('product_info.name.placeholder')}
                    name="arName"
                    value={formData.arName}
                    onChange={handleInputChange}
                    required
                    dir="rtl"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 text-right`}>{t('product_info.description.label')}</label>
                  <textarea
                    name="arDescription"
                    value={formData.arDescription}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={5}
                    placeholder={t('product_info.description.placeholder')}
                    dir="rtl"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2`}>{t('product_info.name.label')} {t('product_info.name.required')}</label>
                  <Input
                    placeholder={t('product_info.name.placeholder')}
                    name="enName"
                    value={formData.enName}
                    onChange={handleInputChange}
                    required
                    dir="ltr"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2`}>{t('product_info.description.label')}</label>
                  <textarea
                    name="enDescription"
                    value={formData.enDescription}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={5}
                    placeholder={t('product_info.description.placeholder')}
                    dir="ltr"
                  />
                </div>
              </>
            )}

            {/* Price and Offer Price */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('product_info.price.label')} {t('product_info.price.required')}</label>
                <Input
                  type="number"
                  placeholder={t('product_info.price.placeholder')}
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
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('product_info.offer_price.label')}</label>
                <Input
                  type="number"
                  placeholder={t('product_info.offer_price.placeholder')}
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
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('product_info.category.label')}</label>
              <select 
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">{t('product_info.category.placeholder')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('product_info.stock.label')} {t('product_info.stock.required')}</label>
              <Input
                type="number"
                placeholder={t('product_info.stock.placeholder')}
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
              disabled={loading || isCreatingProduct} 
              className={`bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg inline-flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className="h-4 w-4" />
              <span className={isRTL ? 'mr-2' : 'ml-2'}>
                {loading || isCreatingProduct ? t('product_form.submit.loading') : t('product_form.submit.button')}
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductPage;
