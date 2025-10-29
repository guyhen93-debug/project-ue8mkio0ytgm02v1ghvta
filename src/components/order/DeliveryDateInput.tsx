import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliveryDateInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DeliveryDateInput: React.FC<DeliveryDateInputProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <Label htmlFor="delivery_date" className="text-base font-bold">
        {t('delivery_date')} *
      </Label>
      <Input
        id="delivery_date"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        className="h-12 text-base"
        required
      />
    </div>
  );
};

export default DeliveryDateInput;