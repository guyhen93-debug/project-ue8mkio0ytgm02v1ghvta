import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Search, Wrench, Loader2 } from 'lucide-react';
import { orphanedReferencesFixer, OrphanedDataReport } from '@/utils/fixOrphanedReferences';

export default function AdminDataCleanup() {
  const { isManager } = useAuth();
  const { t, language } = useLanguage();
  const tr = (en: string, he: string) => language === 'he' ? he : en;
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState<OrphanedDataReport | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Intercept console.log to display in UI
  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setLogs([]);
    setReport(null);

    // Override console.log temporarily
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      originalLog(...args);
      addLog(args.map(String).join(' '));
    };

    try {
      const scanReport = await orphanedReferencesFixer.scanForOrphanedData();
      setReport(scanReport);
    } catch (err: any) {
      setError(err.message || 'Failed to scan for orphaned references');
    } finally {
      // Restore original console.log
      console.log = originalLog;
      setScanning(false);
    }
  };

  const handleFix = async () => {
    if (!report) return;

    setFixing(true);
    setError(null);
    setLogs([]);

    // Override console.log temporarily
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      originalLog(...args);
      addLog(args.map(String).join(' '));
    };

    try {
      await orphanedReferencesFixer.fixAll();
      addLog('\n✅ All fixes completed successfully!');
      // Re-scan to verify fixes
      setTimeout(() => handleScan(), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to fix orphaned references');
    } finally {
      // Restore original console.log
      console.log = originalLog;
      setFixing(false);
    }
  };

  if (!isManager) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be a manager to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {tr('Data Cleanup & Orphaned Reference Fixer', 'ניקוי נתונים ותיקון הפניות יתומות')}
        </h1>
        <p className="text-muted-foreground">
          {tr(
            'Scan and fix orphaned references from deleted users (like "Piter") to prevent errors.',
            'סרוק ותקן הפניות יתומות ממשתמשים שנמחקו (כמו "פיטר") כדי למנוע שגיאות.'
          )}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {tr('Actions', 'פעולות')}
            </CardTitle>
            <CardDescription>
              {tr('Scan for orphaned data or fix all issues automatically', 'סרוק נתונים יתומים או תקן את כל הבעיות אוטומטית')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={handleScan}
              disabled={scanning || fixing}
              className="flex-1"
            >
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tr('Scanning...', 'סורק...')}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {tr('Scan for Issues', 'סרוק בעיות')}
                </>
              )}
            </Button>

            <Button
              onClick={handleFix}
              disabled={!report || scanning || fixing}
              variant="default"
              className="flex-1 piter-yellow"
            >
              {fixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tr('Fixing...', 'מתקן...')}
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  {tr('Fix All Issues', 'תקן את כל הבעיות')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Scan Results */}
        {report && (
          <Card>
            <CardHeader>
              <CardTitle>
                {tr('Scan Results', 'תוצאות סריקה')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {report.orphanedOrders.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tr('Orphaned Orders', 'הזמנות יתומות')}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {report.orphanedSites.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tr('Orphaned Sites', 'אתרים יתומים')}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {report.orphanedMessages.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tr('Orphaned Messages', 'הודעות יתומות')}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-destructive">
                    {report.orphanedNotifications.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tr('Orphaned Notifications', 'התראות יתומות')}
                  </div>
                </div>
              </div>

              {report.potentialPiterClientId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {tr(
                      `Found a client with "Piter" in the name (ID: ${report.potentialPiterClientId})`,
                      `נמצא לקוח עם "פיטר" בשם (מזהה: ${report.potentialPiterClientId})`
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {report.orphanedOrders.length === 0 &&
                report.orphanedSites.length === 0 &&
                report.orphanedMessages.length === 0 &&
                report.orphanedNotifications.length === 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      {tr(
                        'No orphaned references found! Your database is clean.',
                        'לא נמצאו הפניות יתומות! מסד הנתונים שלך נקי.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {tr('Process Logs', 'יומני תהליך')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              {tr('About This Tool', 'אודות כלי זה')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {tr('What does this tool do?', 'מה כלי זה עושה?')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tr(
                  'This tool scans your database for "orphaned" data - records that reference users, clients, or sites that no longer exist. This typically happens when a user is deleted directly without properly cleaning up related data.',
                  'כלי זה סורק את מסד הנתונים שלך עבור נתונים "יתומים" - רשומות המתייחסות למשתמשים, לקוחות או אתרים שכבר לא קיימים. זה בדרך כלל קורה כאשר משתמש נמחק ישירות מבלי לנקות כראוי נתונים קשורים.'
                )}
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                {tr('What will be fixed?', 'מה יתוקן?')}
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>
                  {tr('Orphaned orders will be reassigned to a "System" client', 'הזמנות יתומות יוקצו מחדש ללקוח "מערכת"')}
                </li>
                <li>
                  {tr('Orphaned sites will be reassigned to a "System" client', 'אתרים יתומים יוקצו מחדש ללקוח "מערכת"')}
                </li>
                <li>
                  {tr('Orphaned notifications will be deleted', 'התראות יתומות יימחקו')}
                </li>
                <li>
                  {tr('Orphaned messages will be deleted', 'הודעות יתומות יימחקו')}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                {tr('Is it safe?', 'האם זה בטוח?')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tr(
                  'Yes! This tool only fixes broken references and does not delete any orders or sites. It creates a "System" client to preserve all historical data. Messages and notifications that reference non-existent orders are safely removed.',
                  'כן! כלי זה רק מתקן הפניות שבורות ולא מוחק הזמנות או אתרים. הוא יוצר לקוח "מערכת" כדי לשמר את כל הנתונים ההיסטוריים. הודעות והתראות המתייחסות להזמנות לא קיימות מוסרות בבטחה.'
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
