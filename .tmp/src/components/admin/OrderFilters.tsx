import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrderFiltersProps {
    searchTerm: string;
    statusFilter: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onRefresh: () => void;
    onAddNew: () => void;
    translations: any;
    isRTL: boolean;
    dateRange?: { from?: Date; to?: Date };
    onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
    counts?: Record<string, number>;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
    searchTerm,
    statusFilter,
    onSearchChange,
    onStatusChange,
    onRefresh,
    onAddNew,
    translations: t,
    isRTL,
    dateRange,
    onDateRangeChange,
    counts = {}
}) => {
    return (
        <div className="flex flex-col gap-4">
            {/* Row 1: Action Buttons & Title if needed (handled in parent) */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    className="piter-yellow font-bold py-6 sm:py-2 flex-1 sm:flex-none sm:min-w-[160px] shadow-sm order-2 sm:order-1"
                    onClick={onAddNew}
                >
                    <Plus className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
                    {t.addOrder || t.createOrder}
                </Button>

                <div className="flex flex-1 gap-2 order-1 sm:order-2">
                    <div className="relative flex-1">
                        <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10",
                            isRTL ? "right-3" : "left-3"
                        )} />
                        <Input
                            placeholder={t.search}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={cn(
                                "w-full border-gray-200 focus-visible:ring-yellow-500 bg-white",
                                isRTL ? "pr-10" : "pl-10"
                            )}
                        />
                    </div>
                    <Button variant="outline" onClick={onRefresh} size="icon" className="border-gray-200 bg-white flex-shrink-0">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Row 2: Status & Date Filters */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                <div className="flex-1 flex flex-wrap gap-2">
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
                            className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-bold h-auto transition-all",
                                statusFilter === item.value 
                                    ? "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            )}
                            onClick={() => onStatusChange(item.value)}
                        >
                            {item.label} {counts[item.value] !== undefined && `(${counts[item.value]})`}
                        </Button>
                    ))}
                    
                    {(statusFilter !== 'all' || searchTerm || dateRange?.from) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                onStatusChange('all');
                                onSearchChange('');
                                if (onDateRangeChange) onDateRangeChange({});
                            }}
                            className="text-gray-400 hover:text-gray-600 text-xs px-2 h-auto py-1"
                        >
                            {t.clearFilters || 'Clear Filters'}
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "w-full sm:w-[220px] justify-start text-left font-medium border-gray-200 bg-white h-9",
                                    !dateRange?.from && "text-muted-foreground",
                                    isRTL && "text-right flex-row-reverse"
                                )}
                            >
                                <CalendarIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd/MM/yyyy")
                                    )
                                ) : (
                                    <span>{t.dateRangeLabel || 'Date range'}</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                <span className="text-sm font-bold">{t.dateRangeLabel || 'Date range'}</span>
                                {dateRange?.from && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => onDateRangeChange?.({})}
                                        className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <X className="w-3 h-3 mr-1" />
                                        {t.clearFilter || 'Clear'}
                                    </Button>
                                )}
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => onDateRangeChange?.(range as any)}
                                numberOfMonths={1}
                                locale={isRTL ? he : undefined}
                            />
                        </PopoverContent>
                    </Popover>

                    <Select value={statusFilter} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-[140px] h-9 bg-white border-gray-200 hidden md:flex">
                            <SelectValue placeholder={t.filterAll} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.filterAll}</SelectItem>
                            <SelectItem value="pending">{t.filterPending}</SelectItem>
                            <SelectItem value="approved">{t.filterApproved}</SelectItem>
                            <SelectItem value="rejected">{t.filterRejected}</SelectItem>
                            <SelectItem value="completed">{t.filterCompleted}</SelectItem>
                            <SelectItem value="in_transit">{t.filterInTransit}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};
