import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/entities';

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
  supplier?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ value, onChange, supplier }) => {
  const { language } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const translations = {
    he: {
      label: 'מוצר',
      placeholder: 'בחר מוצר',
      loading: 'טוען מוצרים...',
      noProducts: 'אין מוצרים זמינים',
      selectSupplierFirst: 'בחר ספק תחילה'
    },
    en: {
      label: 'Product',
      placeholder: 'Select product',
      loading: 'Loading products...',
      noProducts: 'No products available',
      selectSupplierFirst: 'Select supplier first'
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadProducts();
  }, [supplier]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let data;
      
      if (supplier) {
        data = await Product.filter({ is_active: true, supplier: supplier }, '-created_at', 1000);
      } else {
        data = await Product.filter({ is_active: true }, '-created_at', 1000);
      }
      
      setProducts(data);
      
      if (value && !data.find(p => p.product_id === value)) {
        onChange('');
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="product">{t.label}</Label>
      <Select value={value} onValueChange={onChange} disabled={loading || !supplier}>
        <SelectTrigger id="product">
          <SelectValue placeholder={
            loading ? t.loading : 
            !supplier ? t.selectSupplierFirst : 
            t.placeholder
          } />
        </SelectTrigger>
        <SelectContent>
          {products.length === 0 ? (
            <SelectItem value="none" disabled>
              {t.noProducts}
            </SelectItem>
          ) : (
            products.map((product) => (
              <SelectItem key={product.id} value={product.product_id}>
                {language === 'he' ? product.name_he : product.name_en}
                {product.size && ` (${product.size})`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};