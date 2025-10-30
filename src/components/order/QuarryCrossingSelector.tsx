import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuarryCrossingSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuarryCrossingSelector: React.FC<QuarryCrossingSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  const options = [
    { value: 'default', label: t('default_quarry') },
    { value: 'shifolei_har', label: t('shifolei_har') },
    { value: 'yitzhak_rabin', label: t('yitzhak_rabin') }
  ];

  return (
    <div className="space-y-3">
      <Label htmlFor="quarry_crossing" className="text-base font-bold">
        {t('quarry_crossing')}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12">
          <SelectValue placeholder={t('select_quarry')} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default QuarryCrossingSelector;