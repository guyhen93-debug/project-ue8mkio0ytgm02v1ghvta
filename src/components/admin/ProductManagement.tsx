import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, RefreshCw, Package2 } from 'lucide-react';

const PRODUCTS = [
  { id: 'p_new_sand_0_4', name_he: 'חול חדש 0-4', name_en: 'New Sand 0-4' },
  { id: 'p_new_sand_0_6', name_he: 'חול חדש 0-6', name_en: 'New Sand 0-6' },
  { id: 'p_washed_sand_0_2', name_he: 'חול שטוף 0-2', name_en: 'Washed Sand 0-2' },
  { id: 'p_washed_sand_0_4', name_he: 'חול שטוף 0-4', name_en: 'Washed Sand 0-4' },
  { id: 'granite_4_10', name_he: 'גרניט 4-10', name_en: 'Granite 4-10' },
  { id: 'granite_10_20', name_he: 'גרניט 10-20', name_en: 'Granite 10-20' },
  { id: 'granite_20_40', name_he: 'גרניט 20-40', name_en: 'Granite 20-40' },
  { id: 'granite_10_60', name_he: 'גרניט 10-60', name_en: 'Granite 10-60' },
  { id: 'granite_40_80', name_he: 'גרניט 40-80', name_en: 'Granite 40-80' },
  { id: 'granite_dust', name_he: 'אבק גרניט', name_en: 'Granite Dust' },
  { id: 'gravel_4_25', name_he: 'חצץ 4-25', name_en: 'Gravel 4-25' },
  { id: 'gravel_25_60', name_he: 'חצץ 25-60', name_en: 'Gravel 25-60' },
  { id: 'gravel_dust', name_he: 'אבק חצץ', name_en: 'Gravel Dust' }
];

export const ProductManagement: React.FC = () => {
  const { language } = useLanguage();
  const [products] = useState(PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');

  const translations = {
    he: {
      title: 'ניהול מוצרים',
      search: 'חיפוש מוצר...',
      refresh: 'רענן',
      productName: 'שם המוצר',
      noProducts: 'אין מוצרים במערכת',
      totalProducts: 'סה״כ מוצרים'
    },
    en: {
      title: 'Product Management',
      search: 'Search product...',
      refresh: 'Refresh',
      productName: 'Product Name',
      noProducts: 'No products in the system',
      totalProducts: 'Total Products'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  const filteredProducts = products.filter(product => {
    const name = language === 'he' ? product.name_he : product.name_en;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
          <Input
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={isRTL ? 'pr-10' : 'pl-10'}
          />
        </div>
        <Button variant="outline" size="icon" className="flex-shrink-0">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            {t.totalProducts}: {filteredProducts.length}
          </p>
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
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {language === 'he' ? product.name_he : product.name_en}
                    </h3>
                  </div>
                  <Package2 className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};