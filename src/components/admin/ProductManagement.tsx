import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, Search, RefreshCw, Package2 } from 'lucide-react';

// רשימת מוצרים סטטית
const PRODUCTS = [
  { id: 'p_new_sand_0_4', name_he: 'חול חדש 0-4', name_en: 'New Sand 0-4', price: 0 },
  { id: 'p_new_sand_0_6', name_he: 'חול חדש 0-6', name_en: 'New Sand 0-6', price: 0 },
  { id: 'p_washed_sand_0_2', name_he: 'חול שטוף 0-2', name_en: 'Washed Sand 0-2', price: 0 },
  { id: 'p_washed_sand_0_4', name_he: 'חול שטוף 0-4', name_en: 'Washed Sand 0-4', price: 0 },
  { id: 'granite_4_10', name_he: 'גרניט 4-10', name_en: 'Granite 4-10', price: 0 },
  { id: 'granite_10_20', name_he: 'גרניט 10-20', name_en: 'Granite 10-20', price: 0 },
  { id: 'granite_20_40', name_he: 'גרניט 20-40', name_en: 'Granite 20-40', price: 0 },
  { id: 'granite_10_60', name_he: 'גרניט 10-60', name_en: 'Granite 10-60', price: 0 },
  { id: 'granite_40_80', name_he: 'גרניט 40-80', name_en: 'Granite 40-80', price: 0 },
  { id: 'granite_dust', name_he: 'אבק גרניט', name_en: 'Granite Dust', price: 0 },
  { id: 'gravel_4_25', name_he: 'חצץ 4-25', name_en: 'Gravel 4-25', price: 0 },
  { id: 'gravel_25_60', name_he: 'חצץ 25-60', name_en: 'Gravel 25-60', price: 0 },
  { id: 'gravel_dust', name_he: 'אבק חצץ', name_en: 'Gravel Dust', price: 0 }
];

export const ProductManagement: React.FC = () => {
  const { language } = useLanguage();
  const [products, setProducts] = useState(PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    price: 0
  });

  const translations = {
    he: {
      title: 'ניהול מוצרים',
      editProduct: 'ערוך מוצר',
      search: 'חיפוש מוצר...',
      refresh: 'רענן',
      productName: 'שם המוצר',
      price: 'מחיר (₪)',
      actions: 'פעולות',
      edit: 'ערוך',
      save: 'שמור',
      cancel: 'ביטול',
      noProducts: 'אין מוצרים במערכת',
      productUpdated: 'מוצר עודכן בהצלחה',
      error: 'שגיאה',
      priceNote: 'הערה: ניהול מחירים יתווסף בגרסה עתידית'
    },
    en: {
      title: 'Product Management',
      editProduct: 'Edit Product',
      search: 'Search product...',
      refresh: 'Refresh',
      productName: 'Product Name',
      price: 'Price (₪)',
      actions: 'Actions',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      noProducts: 'No products in the system',
      productUpdated: 'Product updated successfully',
      error: 'Error',
      priceNote: 'Note: Price management will be added in a future version'
    }
  };

  const t = translations[language];

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      price: product.price || 0
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: t.productUpdated });
    setIsDialogOpen(false);
  };

  const filteredProducts = products.filter(product => {
    const name = language === 'he' ? product.name_he : product.name_en;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline" size="icon" className="flex-shrink-0">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Info Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">{t.priceNote}</p>
        </CardContent>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">{t.noProducts}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {language === 'he' ? product.name_he : product.name_en}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t.price}: ₪{product.price}
                    </p>
                  </div>
                  <Package2 className="w-5 h-5 text-gray-400" />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(product)}
                  className="w-full mt-2"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t.edit}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t.editProduct}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.productName}</Label>
              <Input
                value={editingProduct ? (language === 'he' ? editingProduct.name_he : editingProduct.name_en) : ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{t.price}</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" className="piter-yellow flex-1">
                {t.save}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};