import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Package, Settings } from 'lucide-react';

export const QuickManagementTools: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: 'ניהול לקוחות',
      description: 'הוסף, ערוך ומחק לקוחות',
      icon: Users,
      onClick: () => navigate('/admin'),
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'ניהול אתרים',
      description: 'נהל אתרי בנייה של לקוחות',
      icon: MapPin,
      onClick: () => navigate('/admin'),
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'ניהול מוצרים',
      description: 'עדכן מוצרים ומחירים',
      icon: Package,
      onClick: () => navigate('/admin'),
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      title: 'פאנל ניהול מלא',
      description: 'גישה לכל כלי הניהול',
      icon: Settings,
      onClick: () => navigate('/admin'),
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
    }
  ];

  return (
    <Card className="industrial-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-right">כלי ניהול מהירים</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <button
                key={index}
                onClick={tool.onClick}
                className={`${tool.color} border rounded-lg p-4 text-right transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 text-gray-700 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{tool.title}</h3>
                    <p className="text-sm text-gray-600">{tool.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};