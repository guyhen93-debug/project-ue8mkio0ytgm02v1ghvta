import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
}

const NotesInput: React.FC<NotesInputProps> = ({ value, onChange }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <Label htmlFor="notes" className="text-base font-bold">
        {t('additional_notes')}
      </Label>
      <Textarea
        id="notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('special_instructions')}
        rows={3}
        className="text-base"
      />
    </div>
  );
};

export default NotesInput;