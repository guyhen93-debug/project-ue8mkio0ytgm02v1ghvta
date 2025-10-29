import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

interface TruckAccessCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const TruckAccessCheckbox: React.FC<TruckAccessCheckboxProps> = ({ checked, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
      <Checkbox
        id="truck_access"
        checked={checked}
        onCheckedChange={(checked) => onChange(checked as boolean)}
      />
      <Label htmlFor="truck_access" className="text-base font-semibold">
        {t('truck_access')}
      </Label>
    </div>
  );
};

export default TruckAccessCheckbox;