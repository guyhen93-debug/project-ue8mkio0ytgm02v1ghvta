import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuantityInputProps {
  value: string;
  onChange: (value: string) => void;
  showMinimumError: boolean;
  showMultipleError?: boolean;
  showOutsideEilatError?: boolean;
}

const QuantityInput: React.FC<QuantityInputProps> = ({ 
  value, 
  onChange, 
  showMinimumError, 
  showMultipleError = false,
  showOutsideEilatError = false
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <Label htmlFor="quantity" className="text-base font-bold">
        {t('quantity')} *
      </Label>
      <Input
        id="quantity"
        type="number"
        min="0.1"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('enter_quantity')}
        className="h-12 text-base"
        required
      />
      {showMinimumError && (
        <p className="text-red-600 text-sm font-semibold">
          {t('minimum_quantity_external')}
        </p>
      )}
      {showMultipleError && (
        <p className="text-red-600 text-sm font-semibold">
          {t('quantity_multiple_twenty')}
        </p>
      )}
      {showOutsideEilatError && (
        <p className="text-red-600 text-sm font-semibold">
          {t('outside_eilat_min')}
        </p>
      )}
    </div>
  );
};

export default QuantityInput;