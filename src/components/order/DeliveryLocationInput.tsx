import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliveryLocationInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DeliveryLocationInput: React.FC<DeliveryLocationInputProps> = ({ value, onChange }) => {
  const { t, language } = useLanguage();

  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          onChange(value + (value ? '\n' : '') + locationString);
          toast({
            title: language === 'he' ? 'מיקום נשתף' : 'Location Shared',
            description: language === 'he' ? 'המיקום שלך נוסף לכתובת האספקה' : 'Your location has been added to the delivery address',
          });
        },
        (error) => {
          toast({
            title: language === 'he' ? 'שגיאה בשיתוף מיקום' : 'Location Error',
            description: language === 'he' ? 'לא ניתן לגשת למיקום שלך' : 'Unable to access your location',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: language === 'he' ? 'שיתוף מיקום לא נתמך' : 'Location Not Supported',
        description: language === 'he' ? 'הדפדפן שלך לא תומך בשיתוף מיקום' : 'Your browser does not support location sharing',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="delivery_location" className="text-base font-bold">
          {t('delivery_location')} *
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={shareLocation}
          className="text-sm"
        >
          <MapPin className="h-4 w-4 mr-1" />
          {t('share_location')}
        </Button>
      </div>
      <Textarea
        id="delivery_location"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('enter_address')}
        rows={4}
        className="text-base"
        required
      />
    </div>
  );
};

export default DeliveryLocationInput;