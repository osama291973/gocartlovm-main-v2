import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: t('newsletter_toast_title'),
        description: t('newsletter_toast_desc'),
      });
      setEmail('');
    }
  };

  return (
    <div className="bg-muted/30 py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">{t('newsletter_title')}</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('newsletter_desc')}
        </p>
        <form onSubmit={handleSubmit} className="flex max-w-md mx-auto gap-2">
          <Input
            type="email"
            placeholder={t('newsletter_input_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-background"
            required
          />
          <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white px-8">
            {t('newsletter_button')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Newsletter;
