import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Moon, Sun, Bell, Shield, Database, Download, Loader2, Upload, Trash2, AlertTriangle } from 'lucide-react';
import ImportDataDialog from '@/components/shared/ImportDataDialog';
import { useNotification } from '@/components/shared/NotificationToast';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function Settings() {
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFreq, setBackupFreq] = useState('weekly');
  const [exporting, setExporting] = useState(false);
  const [importTarget, setImportTarget] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearCountdown, setClearCountdown] = useState(10);
  const [clearing, setClearing] = useState(false);
  const countdownRef = useRef(null); // 'Faculty' | 'Rooms' | 'Subjects'
  const { notify } = useNotification();
  const queryClient = useQueryClient();

  // Load settings from user data
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.theme) setTheme(user.theme);
      if (user?.notifications_enabled !== undefined) setNotifications(user.notifications_enabled);
      if (user?.auto_backup !== undefined) setAutoBackup(user.auto_backup);
      if (user?.backup_frequency) setBackupFreq(user.backup_frequency);
    }).catch(() => {});

    // Apply stored theme
    const stored = localStorage.getItem('edu-theme');
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('edu-theme', next);
    base44.auth.updateMe({ theme: next }).catch(() => {});
    notify('Theme Changed', `Switched to ${next} mode`);
  };

  const handleNotificationToggle = (val) => {
    setNotifications(val);
    base44.auth.updateMe({ notifications_enabled: val }).catch(() => {});
    notify(val ? 'Notifications On' : 'Notifications Off', val ? 'You will receive alerts' : 'Alerts disabled');
  };

  const handleBackupToggle = (val) => {
    setAutoBackup(val);
    base44.auth.updateMe({ auto_backup: val }).catch(() => {});
    notify('Backup Settings', val ? 'Auto-backup enabled' : 'Auto-backup disabled');
  };

  const IMPORT_ENTITY_MAP = {
    Faculty: base44.entities.Faculty,
    Rooms: base44.entities.Room,
    Subjects: base44.entities.Subject,
  };
  const IMPORT_QUERY_KEY_MAP = {
    Faculty: 'faculty',
    Rooms: 'rooms',
    Subjects: 'subjects',
  };

  const handleImport = async (records) => {
    const entity = IMPORT_ENTITY_MAP[importTarget];
    if (!entity) return;
    await Promise.all(records.map(r => entity.create(r)));
    queryClient.invalidateQueries({ queryKey: [IMPORT_QUERY_KEY_MAP[importTarget]] });
    notify('Imported', `${records.length} ${importTarget.toLowerCase()} record(s) added`);
  };

  const openClearModal = () => {
    setShowClearModal(true);
    setClearCountdown(10);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setClearCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClearAll = async () => {
    setClearing(true);
    const [faculty, rooms, subjects, timetables] = await Promise.all([
      base44.entities.Faculty.list(),
      base44.entities.Room.list(),
      base44.entities.Subject.list(),
      base44.entities.Timetable.list(),
    ]);
    await Promise.all([
      ...faculty.map(r => base44.entities.Faculty.delete(r.id)),
      ...rooms.map(r => base44.entities.Room.delete(r.id)),
      ...subjects.map(r => base44.entities.Subject.delete(r.id)),
      ...timetables.map(r => base44.entities.Timetable.delete(r.id)),
    ]);
    queryClient.invalidateQueries();
    setClearing(false);
    setShowClearModal(false);
    notify('All Data Cleared', 'All records have been permanently deleted');
  };

  const handleExport = async () => {
    setExporting(true);
    const [faculty, rooms, subjects, timetables] = await Promise.all([
      base44.entities.Faculty.list(),
      base44.entities.Room.list(),
      base44.entities.Subject.list(),
      base44.entities.Timetable.list(),
    ]);
    const blob = new Blob([JSON.stringify({ faculty, rooms, subjects, timetables }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduschedule-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    notify('Export Complete', 'Backup file downloaded');
  };

  const sections = [
    {
      icon: theme === 'dark' ? Moon : Sun,
      title: 'Appearance',
      description: 'Toggle between light and dark mode',
      action: (
        <div className="flex items-center gap-3">
          <Sun className="w-4 h-4 text-muted-foreground" />
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          <Moon className="w-4 h-4 text-muted-foreground" />
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Enable or disable notification alerts',
      action: <Switch checked={notifications} onCheckedChange={handleNotificationToggle} />,
    },
    {
      icon: Shield,
      title: 'Auto Backup',
      description: 'Automatically backup your data',
      action: (
        <div className="flex items-center gap-3">
          <Switch checked={autoBackup} onCheckedChange={handleBackupToggle} />
          {autoBackup && (
            <Select value={backupFreq} onValueChange={(v) => {
              setBackupFreq(v);
              base44.auth.updateMe({ backup_frequency: v }).catch(() => {});
            }}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      ),
    },
    {
      icon: Database,
      title: 'Export Data',
      description: 'Download all your data as JSON backup',
      action: (
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export
        </Button>
      ),
    },
    {
      icon: Upload,
      title: 'Import Data',
      description: 'Bulk import Faculty, Rooms, or Subjects from JSON, CSV, or Excel',
      action: (
        <div className="flex gap-2 flex-wrap justify-end">
          {['Faculty', 'Rooms', 'Subjects'].map(t => (
            <Button key={t} variant="outline" size="sm" onClick={() => setImportTarget(t)}>
              <Upload className="w-3.5 h-3.5 mr-1.5" />{t}
            </Button>
          ))}
        </div>
      ),
    },
    {
      icon: Trash2,
      title: 'Clear All Data',
      description: 'Permanently delete all timetables, faculty, subjects and rooms',
      action: (
        <Button variant="destructive" onClick={openClearModal}>
          <Trash2 className="w-4 h-4 mr-2" />Clear All Data
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      {importTarget && (
        <ImportDataDialog
          open={!!importTarget}
          onOpenChange={(v) => !v && setImportTarget(null)}
          entityName={importTarget}
          onImport={handleImport}
        />
      )}

      {/* Clear All Data Confirmation Modal */}
      <Dialog open={showClearModal} onOpenChange={(v) => { if (!v) { clearInterval(countdownRef.current); setShowClearModal(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Clear All Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-destructive mb-1">⚠️ This action cannot be undone</p>
              <p className="text-sm text-muted-foreground">This will permanently delete all <strong>Timetables</strong>, <strong>Faculty</strong>, <strong>Subjects</strong>, and <strong>Rooms</strong> from the database.</p>
            </div>
            {clearCountdown > 0 ? (
              <div className="text-center py-3">
                <div className="w-14 h-14 rounded-full border-4 border-destructive/30 border-t-destructive flex items-center justify-center mx-auto mb-2 animate-spin" style={{ animationDuration: '1s' }} />
                <p className="text-sm text-muted-foreground">Please wait <span className="font-bold text-destructive text-lg">{clearCountdown}s</span> before confirming</p>
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground">You may now confirm the deletion.</p>
            )}
            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button variant="outline" onClick={() => { clearInterval(countdownRef.current); setShowClearModal(false); }}>Cancel</Button>
              <Button variant="destructive" disabled={clearCountdown > 0 || clearing} onClick={handleClearAll}>
                {clearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {clearCountdown > 0 ? `Wait ${clearCountdown}s...` : 'Confirm Delete All'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {sections.map((section, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{section.title}</p>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>
            <div className="shrink-0">{section.action}</div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}