import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Phone, FileText } from 'lucide-react';

interface OrderContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactPhone: string;
  notes: string;
  orderNumber: string;
}

const OrderContactDialog: React.FC<OrderContactDialogProps> = ({
  open,
  onOpenChange,
  contactName,
  contactPhone,
  notes,
  orderNumber
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            פרטי הזמנה #{orderNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-yellow-600" />
              איש קשר באתר
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">שם:</span>
                <span className="text-sm font-medium text-gray-900">
                  {contactName || 'לא צוין'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">טלפון:</span>
                <a 
                  href={`tel:${contactPhone}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {contactPhone || 'לא צוין'}
                </a>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-600" />
              הערות
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              {notes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {notes}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  אין הערות להזמנה זו
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderContactDialog;