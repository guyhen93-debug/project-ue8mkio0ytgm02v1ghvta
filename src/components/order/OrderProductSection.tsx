import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductSelector } from '@/components/order/ProductSelector';
import { Package, Factory, Info, AlertCircle } from 'lucide-react';

interface OrderProductSectionProps {
    formData: any;
    useCubicMeters: boolean;
    validation: any;
    multipleRequirement: number;
    minQuantity: number;
    CUBIC_TO_TON_RATIO: number;
    onSupplierChange: (supplier: string) => void;
    onProductChange: (productId: string) => void;
    onQuantityChange: (quantity: string) => void;
    onUnitToggle: (checked: boolean) => void;
    getDisplayQuantity: () => string;
}

export const OrderProductSection: React.FC<OrderProductSectionProps> = ({
    formData,
    useCubicMeters,
    validation,
    multipleRequirement,
    minQuantity,
    CUBIC_TO_TON_RATIO,
    onSupplierChange,
    onProductChange,
    onQuantityChange,
    onUnitToggle,
    getDisplayQuantity
}) => {
    const suppliers = [
        { id: 'shifuli_har', name_he: 'שיפולי הר', name_en: 'Shifuli Har' },
        { id: 'maavar_rabin', name_he: 'מעבר רבין', name_en: 'Maavar Rabin' }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-500" />
                    מוצר וכמות
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="supplier" className="text-right block">
                        ספק <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.supplier} onValueChange={onSupplierChange}>
                        <SelectTrigger className="text-right">
                            <SelectValue placeholder="בחר ספק" />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                    <div className="flex items-center gap-2">
                                        <Factory className="h-4 w-4" />
                                        {supplier.name_he}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {formData.supplier && (
                    <>
                        <ProductSelector
                            supplier={formData.supplier}
                            value={formData.product_id}
                            onChange={onProductChange}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="quantity" className="text-right">
                                    כמות <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="unit-toggle" className="text-sm text-gray-600">
                                        {useCubicMeters ? 'מ״ק' : 'טון'}
                                    </Label>
                                    <Switch
                                        id="unit-toggle"
                                        checked={useCubicMeters}
                                        onCheckedChange={onUnitToggle}
                                    />
                                </div>
                            </div>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                step={multipleRequirement || "1"}
                                value={getDisplayQuantity()}
                                onChange={(e) => onQuantityChange(e.target.value)}
                                placeholder={`הכנס כמות ב${useCubicMeters ? 'מ״ק' : 'טון'}`}
                                className="text-right"
                            />
                            <p className="text-xs text-gray-500 text-right">
                                {useCubicMeters
                                    ? `≈ ${formData.quantity_tons || '0'} טון`
                                    : `≈ ${formData.quantity_tons ? Math.round(parseInt(formData.quantity_tons) / CUBIC_TO_TON_RATIO) : '0'} מ״ק`
                                }
                            </p>
                        </div>

                        {/* Quantity Requirements Info - Only for external delivery */}
                        {formData.supplier && formData.delivery_method === 'external' && (
                            <Alert className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-sm text-blue-900">
                                    <div className="space-y-1">
                                        <p className="font-bold">
                                            הובלה חיצונית - {formData.supplier === 'shifuli_har' ? 'שיפולי הר' : 'מעבר רבין'}:
                                        </p>
                                        <p>
                                            • הזמנה בכפולות של {multipleRequirement} טון בלבד
                                        </p>
                                        {formData.supplier === 'maavar_rabin' && (
                                            <p>• מינימום הזמנה: 40 טון</p>
                                        )}
                                        {formData.supplier === 'shifuli_har' && (
                                            <p>• מינימום הזמנה: {minQuantity} טון</p>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {formData.supplier && formData.delivery_method === 'self' && (
                            <Alert className="bg-green-50 border-green-200">
                                <Info className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-sm text-green-900">
                                    <p className="font-bold">איסוף עצמי - ללא מגבלת כמות</p>
                                </AlertDescription>
                            </Alert>
                        )}

                        {!validation.valid && formData.quantity_tons && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    {validation.message}
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};