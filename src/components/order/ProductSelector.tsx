import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/entities';
import { Package } from 'lucide-react';

interface ProductSelectorProps {
  value: string;
  onChange: (value: string) => void;
  supplier: string;
  disabled?: boolean;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  supplier,
  disabled = false
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [supplier]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await Product.list('-created_at', 1000);
      const filtered = allProducts.filter(
        (p: any) => p.is_active && (!supplier || p.supplier === supplier)
      );
      setProducts(filtered);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="product">מוצר *</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || loading || !supplier}>
        <SelectTrigger id="product" className="text-right">
          <SelectValue placeholder={loading ? "טוען..." : supplier ? "בחר מוצר" : "בחר ספק תחילה"}>
            {selectedProduct && (
              <div className="flex items-center gap-2">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name_he}
                    className="w-6 h-6 object-cover rounded"
                  />
                ) : (
                  <Package className="h-4 w-4 text-gray-400" />
                )}
                <span>{selectedProduct.name_he}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              <div className="flex items-center gap-3 py-1">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name_he}
                    className="w-10 h-10 object-cover rounded border"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 text-right">
                  <div className="font-medium">{product.name_he}</div>
                  {product.size && (
                    <div className="text-xs text-gray-500">{product.size}</div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
          {products.length === 0 && !loading && (
            <div className="p-4 text-center text-gray-500 text-sm">
              {supplier ? 'אין מוצרים זמינים לספק זה' : 'בחר ספק תחילה'}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};