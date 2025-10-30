import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productList = await mockDataService.getProducts();
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleProductSelect = async (productId: string) => {
    try {
      const product = await mockDataService.getProductPreview(productId);
      if (product) {
        setSelectedProduct(product);
        setShowPreview(true);
        onChange(productId);
      }
    } catch (error) {
      console.error('Error loading product preview:', error);
      onChange(productId);
    }
  };

  const getProductDisplayName = (product: any) => {
    return t(product.id) || product.display_name_he || product.name;
  };

  return (
    <>
      <div className="space-y-3">
        <Label htmlFor="product" className="text-base font-bold">
          {t('product')} *
        </Label>
        <Select value={value} onValueChange={handleProductSelect}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder={t('select_product')} />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {getProductDisplayName(product)} ({product.size_label})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('product_preview')}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedProduct.image_url}
                  alt={getProductDisplayName(selectedProduct)}
                  className="w-24 h-24 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/favicon.ico';
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {getProductDisplayName(selectedProduct)}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {t('product_description')}:
                </p>
                <p className="text-sm">
                  {t.language === 'he' ? selectedProduct.description_he : selectedProduct.description_en}
                </p>
              </div>
              <Button
                onClick={() => setShowPreview(false)}
                className="w-full"
              >
                {t('ok')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductSelector;