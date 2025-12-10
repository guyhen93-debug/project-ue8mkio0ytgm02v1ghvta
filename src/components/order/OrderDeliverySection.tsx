import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Truck, Sun, Sunset, TruckIcon, PackageCheck } from 'lucide-react';

interface OrderDeliverySectionProps {
    formData: any;
    truckAccessSpace: boolean;
    isMaavarRabin: boolean;
    shouldShowTruckAccessCheckbox: boolean;
    onDeliveryDateChange: (date: string) => void;
    onDeliveryWindowChange: (window: string) => void;
    onDeliveryMethodChange: (method: string) => void;
    onTruckAccessChange: (checked: boolean) => void;
}

export const OrderDeliverySection: React.FC<OrderDeliverySectionProps> = ({
    formData,
    truckAccessSpace,
    isMaavarRabin,
    shouldShowTruckAccessCheckbox,
    onDeliveryDateChange,
    onDeliveryWindowChange,
    onDeliveryMethodChange,
    onTruckAccessChange
}) => {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        מועד אספקה
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="delivery_date" className="text-right block">
                            תאריך אספקה <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="delivery_date"
                            type="date"
                            value={formData.delivery_date}
                            onChange={(e) => onDeliveryDateChange(e.target.value)}
                            className="text-right"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delivery_window" className="text-right block">
                            חלון זמן <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.delivery_window}
                            onValueChange={onDeliveryWindowChange}
                        >
                            <SelectTrigger className="text-right">
                                <SelectValue placeholder="בחר חלון זמן" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="morning">
                                    <div className="flex items-center gap-2">
                                        <Sun className="h-4 w-4 text-yellow-500" />
                                        בוקר (08:00-12:00)
                                    </div>
                                </SelectItem>
                                <SelectItem value="afternoon">
                                    <div className="flex items-center gap-2">
                                        <Sunset className="h-4 w-4 text-orange-500" />
                                        אחר הצהריים (12:00-16:00)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-5 w-5 text-gray-500" />
                        שיטת אספקה
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="delivery_method" className="text-right block">
                            סוג הובלה <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.delivery_method}
                            onValueChange={onDeliveryMethodChange}
                            disabled={isMaavarRabin}
                        >
                            <SelectTrigger className="text-right">
                                <SelectValue placeholder="בחר סוג הובלה" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="self">
                                    <div className="flex items-center gap-2">
                                        <TruckIcon className="h-4 w-4 text-blue-600" />
                                        איסוף עצמי
                                    </div>
                                </SelectItem>
                                <SelectItem value="external">
                                    <div className="flex items-center gap-2">
                                        <PackageCheck className="h-4 w-4 text-green-600" />
                                        הובלה חיצונית
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {isMaavarRabin && (
                            <p className="text-xs text-gray-500 text-right">
                                מעבר רבין: הובלה חיצונית בלבד
                            </p>
                        )}
                    </div>

                    {/* Truck Access Space Checkbox */}
                    {shouldShowTruckAccessCheckbox && (
                        <div className="space-y-3">
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="truck_access"
                                        checked={truckAccessSpace}
                                        onCheckedChange={onTruckAccessChange}
                                        disabled={isMaavarRabin}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <Label
                                            htmlFor="truck_access"
                                            className={`text-sm font-bold cursor-pointer ${isMaavarRabin ? 'text-gray-500' : 'text-gray-900'}`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <TruckIcon className="h-5 w-5 text-orange-600" />
                                                <span>יש מקום באתר לפריקה של משאית אמבטיה / פול טריילר</span>
                                            </div>
                                        </Label>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            משאית אמבטיה או פול טריילר (משאית ועגלה) דורשים מקום רחב יותר לפריקה.
                                            {isMaavarRabin && (
                                                <span className="block mt-1 text-orange-700 font-medium">
                                                    מעבר רבין: תיבה זו מסומנת אוטומטית ולא ניתנת לשינוי
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};