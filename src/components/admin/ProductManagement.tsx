import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name_he: '',
    size_label: '',
    description_en: '',
    description_he: '',
    image_url: ''
  });
  const { t } = useLanguage();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productList = await mockDataService.getProducts();
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await mockDataService.updateProduct(editingProduct.id, formData);
        toast({
          title: t('product_updated'),
          description: t('product_updated_successfully'),
        });
      } else {
        await mockDataService.createProduct(formData);
        toast({
          title: t('product_created'),
          description: t('product_created_successfully'),
        });
      }
      
      setShowDialog(false);
      setEditingProduct(null);
      resetForm();
      await loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: t('error'),
        description: t('save_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await mockDataService.deleteProduct(productToDelete.id);
      toast({
        title: t('product_deleted'),
        description: t('product_deleted_successfully'),
      });
      
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      display_name_he: product.display_name_he,
      size_label: product.size_label,
      description_en: product.description_en,
      description_he: product.description_he,
      image_url: product.image_url
    });
    setShowDialog(true);
  };

  const openDelete = (product: any) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name_he: '',
      size_label: '',
      description_en: '',
      description_he: '',
      image_url: ''
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('product_management')}
            </CardTitle>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('add_product')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.display_name_he}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{product.display_name_he}</h4>
                    <p className="text-sm text-gray-600">{product.name}</p>
                    <Badge variant="outline" className="mt-1">
                      {product.size_label}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDelete(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t('edit_product') : t('add_product')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('product_name_en')}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sand 0-4mm"
              />
            </div>
            <div>
              <Label>{t('product_name_he')}</Label>
              <Input
                value={formData.display_name_he}
                onChange={(e) => setFormData({ ...formData, display_name_he: e.target.value })}
                placeholder="חול מחצבה (0-4) מ״מ"
              />
            </div>
            <div>
              <Label>{t('size_label')}</Label>
              <Input
                value={formData.size_label}
                onChange={(e) => setFormData({ ...formData, size_label: e.target.value })}
                placeholder="0-4 מ״מ"
              />
            </div>
            <div>
              <Label>{t('description_en')}</Label>
              <Textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="English description"
                rows={2}
              />
            </div>
            <div>
              <Label>{t('description_he')}</Label>
              <Textarea
                value={formData.description_he}
                onChange={(e) => setFormData({ ...formData, description_he: e.target.value })}
                placeholder="תיאור בעברית"
                rows={2}
              />
            </div>
            <div>
              <Label>{t('image_url')}</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {editingProduct ? t('update') : t('create')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingProduct(null);
                resetForm();
              }}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm_delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            {t('confirm_delete_product')} "{productToDelete?.display_name_he}"?
          </p>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              {t('delete')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;