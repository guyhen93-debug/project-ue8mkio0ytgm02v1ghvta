import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliveryTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const DeliveryTypeSelector: React.FC<DeliveryTypeSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <Label className="text-base font-bold">{t('delivery_type')} *</Label>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="self_transport" id="self_transport" />
          <Label htmlFor="self_transport" className="text-base font-semibold">
            {t('self_transport')}
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="external" id="external" />
          <Label htmlFor="external" className="text-base font-semibold">
            {t('external')}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default DeliveryTypeSelector;