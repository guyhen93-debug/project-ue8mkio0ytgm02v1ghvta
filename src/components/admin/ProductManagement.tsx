import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/entities';
import { uploadFile } from '@/integrations/core';
import { Plus, Edit, Trash2, Package, Factory, Upload, X } from 'lucide-react';

export const ProductManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    name_he: '',
    name_en: '',
    size: '',
    supplier: '',
    image_url: '',
    is_active: true
  });

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
        title: 'שגיאה',
        description: 'נכשל בטעינת המוצרים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'שגיאה',
        description: 'אנא בחר קובץ תמונה',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const { file_url } = await uploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast({
        title: 'הצלחה!',
        description: 'התמונה הועלתה בהצלחה',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בהעלאת התמונה',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.name_he || !formData.name_en || !formData.supplier) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingProduct) {
        await Product.update(editingProduct.id, formData);
        toast({
          title: 'הצלחה!',
          description: 'המוצר עודכן בהצלחה',
        });
      } else {
        await Product.create(formData);
        toast({
          title: 'הצלחה!',
          description: 'המוצר נוצר בהצלחה',
        });
      }

      setDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בשמירת המוצר',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      product_id: product.product_id,
      name_he: product.name_he,
      name_en: product.name_en,
      size: product.size || '',
      supplier: product.supplier || '',
      image_url: product.image_url || '',
      is_active: product.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;

    try {
      await Product.delete(id);
      toast({
        title: 'הצלחה!',
        description: 'המוצר נמחק בהצלחה',
      });
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל במחיקת המוצר',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      name_he: '',
      name_en: '',
      size: '',
      supplier: '',
      image_url: '',
      is_active: true
    });
    setEditingProduct(null);
  };

  const suppliers = [
    { id: 'shifuli_har', name_he: 'שיפולי הר', name_en: 'Shifuli Har' },
    { id: 'maavar_rabin', name_he: 'מעבר רבין', name_en: 'Maavar Rabin' }
  ];

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name_he : supplierId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">ניהול מוצרים</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
              <Plus className="h-4 w-4 ml-2" />
              מוצר חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right">
                {editingProduct ? 'עריכת מוצר' : 'מוצר חדש'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">מזהה מוצר *</Label>
                <Input
                  id="product_id"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  placeholder="לדוגמה: granite_10_60"
                  className="text-right"
                  disabled={!!editingProduct}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_he">שם בעברית *</Label>
                <Input
                  id="name_he"
                  value={formData.name_he}
                  onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                  placeholder="לדוגמה: גרניט 10-60"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_en">שם באנגלית *</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g., Granite 10-60"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">גודל</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="לדוגמה: 10-60 מ״מ"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">ספק *</Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר ספק" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name_he}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>תמונת מוצר</Label>
                {formData.image_url ? (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="תמונת מוצר"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 left-2"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <Label
                      htmlFor="image-upload"
                      className="cursor-pointer text-sm text-gray-600 hover:text-gray-900"
                    >
                      {uploading ? 'מעלה...' : 'לחץ להעלאת תמונה'}
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black">
                  {editingProduct ? 'עדכן' : 'צור'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name_he}
                    className="w-20 h-20 object-cover rounded-lg border flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">{product.name_he}</h3>
                    {!product.is_active && (
                      <Badge variant="secondary">לא פעיל</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{product.name_en}</p>
                  {product.size && (
                    <p className="text-sm text-gray-500 mb-2">גודל: {product.size}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Factory className="h-4 w-4 text-gray-400" />
                    <Badge variant="outline" className="text-xs">
                      {getSupplierName(product.supplier)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">מזהה: {product.product_id}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              אין מוצרים במערכת. לחץ על "מוצר חדש" כדי להוסיף.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};