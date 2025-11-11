import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, Trash2, Search, RefreshCw, Package2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const ProductManagement: React.FC = () => {
  const { language } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    name_he: '',
    name_en: '',
    category: 'sand',
    is_active: true
  });

  const translations = {
    he: {
      title: 'ניהול מוצרים',
      addProduct: 'הוסף מוצר',
      editProduct: 'ערוך מוצר',
      search: 'חיפוש מוצר...',
      refresh: 'רענן',
      productId: 'מזהה מוצר',
      nameHe: 'שם בעברית',
      nameEn: 'שם באנגלית',
      category: 'קטגוריה',
      sand: 'חול',
      granite: 'גרניט',
      gravel: 'חצץ',
      status: 'סטטוס',
      active: 'פעיל',
      inactive: 'לא פעיל',
      actions: 'פעולות',
      edit: 'ערוך',
      delete: 'מחק',
      save: 'שמור',
      cancel: 'ביטול',
      noProducts: 'אין מוצרים במערכת',
      addFirstProduct: 'הוסף את המוצר הראשון',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק מוצר זה?',
      productAdded: 'מוצר נוסף בהצלחה',
      productUpdated: 'מוצר עודכן בהצלחה',
      productDeleted: 'מוצר נמחק בהצלחה',
      error: 'שגיאה',
      requiredFields: 'יש למלא את כל השדות החובה',
      totalProducts: 'סה״כ מוצרים'
    },
    en: {
      title: 'Product Management',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      search: 'Search product...',
      refresh: 'Refresh',
      productId: 'Product ID',
      nameHe: 'Name in Hebrew',
      nameEn: 'Name in English',
      category: 'Category',
      sand: 'Sand',
      granite: 'Granite',
      gravel: 'Gravel',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      noProducts: 'No products in the system',
      addFirstProduct: 'Add your first product',
      deleteConfirm: 'Are you sure you want to delete this product?',
      productAdded: 'Product added successfully',
      productUpdated: 'Product updated successfully',
      productDeleted: 'Product deleted successfully',
      error: 'Error',
      requiredFields: 'Please fill all required fields',
      totalProducts: 'Total Products'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await Product.list('-created_at', 1000);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: t.error,
        description: 'Failed to load products',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id.trim() || !formData.name_he.trim() || !formData.name_en.trim()) {
      toast({
        title: t.error,
        description: t.requiredFields,
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingProduct) {
        await Product.update(editingProduct.id, formData);
        toast({ title: t.productUpdated });
      } else {
        await Product.create(formData);
        toast({ title: t.productAdded });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: t.error,
        description: 'Failed to save product',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      product_id: product.product_id,
      name_he: product.name_he,
      name_en: product.name_en,
      category: product.category || 'sand',
      is_active: product.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      await Product.delete(id);
      toast({ title: t.productDeleted });
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: t.error,
        description: 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      name_he: '',
      name_en: '',
      category: 'sand',
      is_active: true
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name_he?.toLowerCase().includes(searchLower) ||
      product.name_en?.toLowerCase().includes(searchLower) ||
      product.product_id?.toLowerCase().includes(searchLower)
    );
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
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="piter-yellow flex-1 sm:flex-none">
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.addProduct}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? t.editProduct : t.addProduct}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product_id">{t.productId}</Label>
                  <Input
                    id="product_id"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    placeholder="p_new_sand_0_4"
                    disabled={!!editingProduct}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_he">{t.nameHe}</Label>
                  <Input
                    id="name_he"
                    value={formData.name_he}
                    onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                    placeholder="חול חדש 0-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t.nameEn}</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="New Sand 0-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t.category}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sand">{t.sand}</SelectItem>
                      <SelectItem value="granite">{t.granite}</SelectItem>
                      <SelectItem value="gravel">{t.gravel}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{t.status}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {formData.is_active ? t.active : t.inactive}
                    </span>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
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
          <Button variant="outline" onClick={loadProducts} size="icon" className="flex-shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
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
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">{t.noProducts}</p>
            <p className="text-sm text-gray-500">{t.addFirstProduct}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {language === 'he' ? product.name_he : product.name_en}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{product.product_id}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {t[product.category] || product.category}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? t.active : t.inactive}
                      </span>
                    </div>
                  </div>
                  <Package2 className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t.edit}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(product.id)}
                    className="flex-1"
                  >
                    <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t.delete}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};