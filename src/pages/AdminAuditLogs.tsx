import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuditLog } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Search, Filter, Clock, User, FileText } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_email: string;
  user_role: string;
  changes: Record<string, any>;
  metadata: Record<string, any>;
  timestamp: string;
  created_at: string;
}

const translations = {
  he: {
    title: 'יומן פעולות (Audit Log)',
    subtitle: 'מעקב אחר כל השינויים במערכת',
    refresh: 'רענן',
    loading: 'טוען...',
    noLogs: 'אין רשומות יומן',
    search: 'חיפוש לפי אימייל או מזהה...',
    filterByEntity: 'סנן לפי ישות',
    filterByAction: 'סנן לפי פעולה',
    allEntities: 'כל הישויות',
    allActions: 'כל הפעולות',
    actions: {
      create: 'יצירה',
      update: 'עדכון',
      delete: 'מחיקה',
      soft_delete: 'מחיקה רכה',
      restore: 'שחזור',
      status_change: 'שינוי סטטוס'
    },
    entities: {
      Order: 'הזמנה',
      Client: 'לקוח',
      Site: 'אתר',
      Product: 'מוצר',
      User: 'משתמש',
      Notification: 'התראה',
      Message: 'הודעה'
    },
    details: 'פרטים',
    changes: 'שינויים',
    before: 'לפני',
    after: 'אחרי',
    by: 'על ידי',
    at: 'בשעה',
    accessDenied: 'גישה נדחתה',
    managersOnly: 'דף זה זמין למנהלים בלבד'
  },
  en: {
    title: 'Audit Log',
    subtitle: 'Track all changes in the system',
    refresh: 'Refresh',
    loading: 'Loading...',
    noLogs: 'No audit logs found',
    search: 'Search by email or ID...',
    filterByEntity: 'Filter by entity',
    filterByAction: 'Filter by action',
    allEntities: 'All entities',
    allActions: 'All actions',
    actions: {
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      soft_delete: 'Soft Delete',
      restore: 'Restore',
      status_change: 'Status Change'
    },
    entities: {
      Order: 'Order',
      Client: 'Client',
      Site: 'Site',
      Product: 'Product',
      User: 'User',
      Notification: 'Notification',
      Message: 'Message'
    },
    details: 'Details',
    changes: 'Changes',
    before: 'Before',
    after: 'After',
    by: 'By',
    at: 'At',
    accessDenied: 'Access Denied',
    managersOnly: 'This page is available to managers only'
  }
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  soft_delete: 'bg-orange-100 text-orange-800',
  restore: 'bg-purple-100 text-purple-800',
  status_change: 'bg-yellow-100 text-yellow-800'
};

export default function AdminAuditLogs() {
  const { user, isManager } = useAuth();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const auditLogs = await AuditLog.list('-timestamp', 500);
      setLogs(auditLogs as AuditLogEntry[]);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      loadLogs();
    }
  }, [isManager]);

  if (!isManager) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600">{t.accessDenied}</h2>
            <p className="text-gray-600 mt-2">{t.managersOnly}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.metadata?.order_number && log.metadata.order_number.toString().includes(searchTerm));

    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesEntity && matchesAction;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderChanges = (changes: Record<string, any>) => {
    if (!changes || Object.keys(changes).length === 0) return null;

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
        <h4 className="font-medium mb-2">{t.changes}:</h4>
        {changes.before && (
          <div className="mb-2">
            <span className="text-red-600 font-medium">{t.before}:</span>
            <pre className="mt-1 text-xs bg-red-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(changes.before, null, 2)}
            </pre>
          </div>
        )}
        {changes.after && (
          <div>
            <span className="text-green-600 font-medium">{t.after}:</span>
            <pre className="mt-1 text-xs bg-green-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(changes.after, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{t.title}</CardTitle>
              <p className="text-gray-500 mt-1">{t.subtitle}</p>
            </div>
            <Button onClick={loadLogs} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 ${language === 'he' ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className={`absolute top-2.5 ${language === 'he' ? 'right-3' : 'left-3'} h-4 w-4 text-gray-400`} />
                <Input
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={language === 'he' ? 'pr-10' : 'pl-10'}
                />
              </div>
            </div>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.filterByEntity} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allEntities}</SelectItem>
                {Object.entries(t.entities).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t.filterByAction} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allActions}</SelectItem>
                {Object.entries(t.actions).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t.loading}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t.noLogs}</div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <Card
                    key={log.id}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${expandedLog === log.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={actionColors[log.action] || 'bg-gray-100'}>
                            {t.actions[log.action as keyof typeof t.actions] || log.action}
                          </Badge>
                          <Badge variant="outline">
                            {t.entities[log.entity_type as keyof typeof t.entities] || log.entity_type}
                          </Badge>
                          {log.metadata?.order_number && (
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              #{log.metadata.order_number}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {log.user_email}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {log.entity_id.substring(0, 8)}...
                        </div>
                      </div>

                      {expandedLog === log.id && (
                        <div className="mt-4 border-t pt-4">
                          {renderChanges(log.changes)}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                              <h4 className="font-medium mb-2">Metadata:</h4>
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
