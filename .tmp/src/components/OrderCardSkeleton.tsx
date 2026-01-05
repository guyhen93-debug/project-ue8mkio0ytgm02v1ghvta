import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const OrderCardSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
      </div>
    </CardContent>
  </Card>
);
