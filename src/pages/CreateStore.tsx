import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface FormData {
  username: string;
  name_en: string;
  description_en: string;
  name_ar: string;
  description_ar: string;
  email: string;
  contact_number: string;
  address: string;
  logo: File | null;
}

const CreateStore = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  // Enforce Supabase free tier max file size (50 MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // bytes
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    name_en: '',
    description_en: '',
    name_ar: '',
    description_ar: '',
    email: '',
    contact_number: '',
    address: '',
    logo: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    // Redirect if user is already a pending or approved seller
    if (!authLoading && user) {
      if (hasRole('seller')) {
        navigate('/seller');
      }
    }
  }, [user, hasRole, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check if we have at least one language filled out
      if (!formData.name_en && !formData.name_ar) {
        throw new Error('Store name is required in at least one language');
      }

      let logoUrl = '/gocart-logo.svg'; // Default logo
      if (formData.logo) {
        if (formData.logo.size > MAX_FILE_SIZE) {
          throw new Error(language === 'ar' ? 'الملف كبير جدًا (حد 50 ميغابايت)' : 'File too large (limit: 50MB)');
        }
        // Upload logo to Supabase storage (bucket: store-logos)
        const fileExt = formData.logo.name.split('.').pop();
        // store files under a user-specific folder so RLS policies that check foldername(name)[1] = auth.uid() work
        const baseName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${baseName}`;
        const { data: uploadData, error: uploadError } = await (supabase as any)
          .storage
          .from('store-logos')
          .upload(filePath, formData.logo);
        if (uploadError) throw uploadError;
        logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/store-logos/${filePath}`;
      }

      // Apply for seller status, passing store name, description, optional logo, username, and contact info
      const { error: applicationError } = await (supabase as any).rpc('apply_for_seller', {
        store_name: formData.name_en || formData.name_ar,
        store_description: formData.description_en || formData.description_ar,
        store_logo: logoUrl || null,
        username: formData.username || null,
        email: formData.email || null,
        contact_number: formData.contact_number || null,
        address: formData.address || null
      });

      if (applicationError) throw applicationError;

      toast({
        title: 'Application Submitted',
        description: 'Your seller application has been submitted for review. You will be notified once it is approved.',
      });

      navigate('/seller');

    } catch (error: any) {
      console.error('Application error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2">
        {language === 'ar' ? 'التقدم كبائع' : 'Apply as Seller'}
      </h1>
      <p className="text-muted-foreground mb-8">
        {language === 'ar'
          ? 'لتصبح بائعًا على GoCart، يرجى تقديم معلومات متجرك للمراجعة. سيتم إخطارك بمجرد الموافقة على طلبك.'
          : 'To become a seller on GoCart, please submit your store information for review. You will be notified once your application is approved.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">
            {language === 'ar' ? 'اسم المستخدم' : 'Username'}
          </Label>
          <Input
            id="username"
            type="text"
            placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter your username'}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            {language === 'ar' ? 'اسم المستخدم الفريد الخاص بك' : 'Your unique seller username'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_en">
            {language === 'ar' ? 'اسم المتجر (إنجليزي)' : 'Store Name (English)'}
          </Label>
          <Input
            id="name_en"
            type="text"
            placeholder={language === 'ar' ? 'أدخل اسم متجرك بالإنجليزية' : 'Enter your store name in English'}
            value={formData.name_en}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            required={!formData.name_ar}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'ar'
              ? 'الحد الأقصى لحجم الملف: 50 ميغابايت (حد الخطة المجانية من Supabase)'
              : 'Max file size: 50MB (Supabase free tier)'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description_en">
            {language === 'ar' ? 'وصف المتجر (إنجليزي)' : 'Store Description (English)'}
          </Label>
          <Textarea
            id="description_en"
            placeholder={language === 'ar' ? 'أدخل وصف المتجر بالإنجليزية' : 'Enter your store description in English'}
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_ar">
            {language === 'ar' ? 'اسم المتجر (عربي)' : 'Store Name (Arabic)'}
          </Label>
          <Input
            id="name_ar"
            type="text"
            placeholder={language === 'ar' ? 'أدخل اسم متجرك بالعربية' : 'Enter your store name in Arabic'}
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            required={!formData.name_en}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description_ar">
            {language === 'ar' ? 'وصف المتجر (عربي)' : 'Store Description (Arabic)'}
          </Label>
          <Textarea
            id="description_ar"
            placeholder={language === 'ar' ? 'أدخل وصف المتجر بالعربية' : 'Enter your store description in Arabic'}
            value={formData.description_ar}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_number">
            {language === 'ar' ? 'رقم الاتصال' : 'Contact Number'}
          </Label>
          <Input
            id="contact_number"
            type="tel"
            placeholder={language === 'ar' ? 'أدخل رقم الاتصال' : 'Enter your contact number'}
            value={formData.contact_number}
            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">
            {language === 'ar' ? 'العنوان' : 'Address'}
          </Label>
          <Textarea
            id="address"
            placeholder={language === 'ar' ? 'أدخل عنوانك' : 'Enter your address'}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">
            {language === 'ar' ? 'شعار المتجر (اختياري)' : 'Store Logo (optional)'}
          </Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file && file.size > MAX_FILE_SIZE) {
                toast({
                  title: language === 'ar' ? 'حجم الملف كبير جداً' : 'File too large',
                  description: language === 'ar'
                    ? `الحد الأقصى المسموح به هو 50 ميغابايت. اختر ملفًا أصغر.`
                    : `Maximum allowed size is 50MB. Please choose a smaller file.`,
                  variant: 'destructive',
                });
                setFormData({ ...formData, logo: null });
                // clear the file input value (best-effort)
                (e.target as HTMLInputElement).value = '';
                return;
              }
              setFormData({ ...formData, logo: file });
            }}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            language === 'ar' ? 'جارٍ التقديم...' : 'Submitting...'
          ) : (
            language === 'ar' ? 'تقديم الطلب' : 'Submit Application'
          )}
        </Button>
      </form>
    </div>
  );
};

export default CreateStore;