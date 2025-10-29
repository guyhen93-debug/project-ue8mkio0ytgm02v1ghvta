import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimeSlotSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  const timeSlots = [
    { value: 'morning', label: t('morning_shift') },
    { value: 'afternoon', label: t('afternoon_shift') }
  ];

  return (
    <div className="space-y-3">
      <Label className="text-base font-bold">{t('time')} *</Label>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {timeSlots.map((slot) => (
          <div key={slot.value} className="flex items-center space-x-3">
            <RadioGroupItem value={slot.value} id={slot.value} />
            <Label htmlFor={slot.value} className="text-base font-semibold">
              {slot.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default TimeSlotSelector;