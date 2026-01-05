import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, Package2, ClipboardList } from 'lucide-react';

export const QuickManagementTools: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: 'ניהול לקוחות',
      description: 'הוסף, ערוך ומחק לקוחות',
      icon: Users,
      onClick: () => navigate('/admin?tab=clients'),
      color: 'text-blue-600'
    },
    {
      title: 'ניהול אתרים',
      description: 'נהל אתרי בנייה ופרטי קשר',
      icon: Building2,
      onClick: () => navigate('/admin?tab=sites'),
      color: 'text-green-600'
    },
    {
      title: 'ניהול מוצרים',
      description: 'עדכן מחירים ומלאי',
      icon: Package2,
      onClick: () => navigate('/admin?tab=products'),
      color: 'text-purple-600'
    },
    {
      title: 'ניהול הזמנות',
      description: 'צפה וערוך את כל ההזמנות',
      icon: ClipboardList,
      onClick: () => navigate('/admin?tab=orders'),
      color: 'text-orange-600'
    }
  ];

  return (
    <Card className="industrial-card">
      <CardHeader className="p-3 sm:p-6 pb-3">
        <CardTitle className="text-lg sm:text-xl font-bold text-right">כלי ניהול מהירים</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {tools.map((tool) => (
            <Button
              key={tool.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-stretch gap-2 hover:bg-gray-50 transition-colors text-right"
              onClick={tool.onClick}
            >
              <tool.icon className={`w-6 h-6 ${tool.color}`} />
              <div className="text-right w-full">
                <h3 className="font-semibold text-sm text-gray-900">{tool.title}</h3>
                <p className="text-xs text-gray-500 leading-snug mt-1">{tool.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
