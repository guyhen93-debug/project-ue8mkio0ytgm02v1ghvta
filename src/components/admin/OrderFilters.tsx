import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Plus } from 'lucide-react';

interface OrderFiltersProps {
    searchTerm: string;
    statusFilter: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onRefresh: () => void;
    onAddNew: () => void;
    translations: any;
    isRTL: boolean;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusChange,
    onRefresh,
    onAddNew,
    translations: t,
    isRTL
}) => {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
                    <Input
                        placeholder={t.search}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                    />
                </div>
                <div className="flex flex-wrap gap-2 justify-stretch sm:justify-end">
                    <Button
                        className="piter-yellow flex-1 min-w-[140px] sm:flex-none"
                        onClick={onAddNew}
                    >
                        <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t.addOrder}
                    </Button>
                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="flex-1 sm:w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.filterAll}</SelectItem>
                            <SelectItem value="pending">{t.filterPending}</SelectItem>
                            <SelectItem value="approved">{t.filterApproved}</SelectItem>
                            <SelectItem value="rejected">{t.filterRejected}</SelectItem>
                            <SelectItem value="completed">{t.filterCompleted}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={onRefresh} size="icon" className="flex-shrink-0">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                {[
                    { value: 'all', label: t.filterAll },
                    { value: 'pending', label: `${t.filterPending} ⏳` },
                    { value: 'approved', label: `${t.filterApproved} ✅` },
                    { value: 'in_transit', label: `${t.filterInTransit} 🚚` },
                    { value: 'completed', label: `${t.filterCompleted} ✔️` },
                    { value: 'rejected', label: `${t.filterRejected} ❌` },
                ].map((item) => (
                    <Button
                        key={item.value}
                        type="button"
                        variant={statusFilter === item.value ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full px-3 py-1 text-xs sm:text-sm font-medium h-auto"
                        onClick={() => onStatusChange(item.value)}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>
        </div>
    );
};
