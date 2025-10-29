import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  const products = [
    { value: 'sand_0_3', label: t('sand_0_3') },
    { value: 'sesame_4_9_5', label: t('sesame_4_9_5') },
    { value: 'lentil_9_5_19', label: t('lentil_9_5_19') },
    { value: 'polia_19_25', label: t('polia_19_25') },
    { value: 'granite_10_60', label: t('granite_10_60') }
  ];

  return (
    <div className="space-y-3">
      <Label htmlFor="product" className="text-base font-bold">
        {t('product')} *
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 text-base">
          <SelectValue placeholder={t('select_product')} />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.value} value={product.value}>
              {product.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductSelector;