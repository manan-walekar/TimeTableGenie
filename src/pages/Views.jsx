import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Calendar, AlertTriangle, ChevronUp, Clock, Download } from 'lucide-react';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import { useNotification } from '@/components/shared/NotificationToast';
import { motion, AnimatePresence } from 'framer-motion';

const SLOT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-teal-100 border-teal-300 text-teal-800',
];

function getAbbr(name = '') {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function exportTimetableDocx(tt) {
  const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
  const FULL_DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const schedule   = tt.schedule || [];
  const getEntry   = (day, slot) => schedule.find(s => s.day === day && s.slot === slot);

  // Collect unique subjects from the schedule
  const subjectMap = {};
  schedule.forEach(s => { if (s.subject_code) subjectMap[s.subject_code] = s; });
  const subjects = Object.values(subjectMap);

  const SLOT_LABELS  = ['1 LECTURE','2 LECTURE','3 LECTURE','4 LECTURE','LUNCH','5 LECTURE','6 LECTURE','7 LECTURE','8 LECTURE','9 LECTURE'];
  const TIME_RANGES  = ['8:30 To 09:20','9:20 To 10:10','10:10 To 11:00','11:00 To 11:50','11:50 To 12:20 / 11:50 To 12:40','12:20 To 13:10 / 12:40 To 13:10','13:10 To 14:00','14:00 To 14:50','14:50 To 15:40','15:40 To 16:30'];

  // Header row 1 – slot numbers
  let hdr1 = `<tr><th rowspan="3" style="background:#e5e7eb;font-weight:bold;">Slot<br/>No.</th>`;
  for (let i = 0; i < 10; i++) {
    const isLunch = i === 4;
    hdr1 += `<th style="background:${isLunch ? '#fff7ed' : '#e5e7eb'};color:${isLunch ? '#ea580c' : '#111'};font-weight:bold;">${i + 1}</th>`;
  }
  hdr1 += `</tr>`;

  // Header row 2 – lecture labels
  let hdr2 = `<tr>`;
  for (let i = 0; i < 10; i++) {
    const isLunch = i === 4;
    hdr2 += `<th style="background:${isLunch ? '#fff7ed' : '#e5e7eb'};color:${isLunch ? '#ea580c' : '#1d4ed8'};font-size:8pt;">${SLOT_LABELS[i]}</th>`;
  }
  hdr2 += `</tr>`;

  // Header row 3 – time ranges
  let hdr3 = `<tr>`;
  for (let i = 0; i < 10; i++) {
    const isLunch = i === 4;
    hdr3 += `<th style="background:${isLunch ? '#fff7ed' : '#f9fafb'};color:${isLunch ? '#ea580c' : '#555'};font-size:7.5pt;font-weight:normal;">${TIME_RANGES[i]}</th>`;
  }
  hdr3 += `</tr>`;

  // Day rows
  let bodyRows = '';
  DAYS_SHORT.forEach((day, di) => {
    bodyRows += `<tr><td style="font-weight:bold;background:#e5e7eb;text-align:center;">${day}</td>`;
    for (let s = 0; s < 10; s++) {
      if (s === 4) {
        bodyRows += `<td style="background:#fff7ed;color:#ea580c;text-align:center;font-weight:bold;">LUNCH</td>`;
        continue;
      }
      const mapped = s < 4 ? s : s - 1;
      const e = getEntry(FULL_DAYS[di], mapped);
      bodyRows += e
        ? `<td style="text-align:center;font-size:8.5pt;"><b>${e.subject_code}(${getAbbr(e.faculty_name)})</b><br/><span style="font-size:7.5pt;">Room ${tt.roomNo || '101'}</span></td>`
        : `<td style="text-align:center;color:#9ca3af;">-</td>`;
    }
    bodyRows += `</tr>`;
  });

  // Subject legend
  let legendRows = subjects.map(s =>
    `<tr>
      <td style="text-align:center;font-weight:bold;">${s.subject_code}</td>
      <td colspan="3">${s.subject_name || s.subject_code}</td>
      <td style="text-align:center;">${s.subject_code?.slice(0,4) || ''}</td>
      <td colspan="4">${s.faculty_name || '-'}</td>
      <td style="text-align:center;">${s.faculty_name ? getAbbr(s.faculty_name) : '-'}</td>
      <td></td>
    </tr>`
  ).join('');

  const instituteName = tt.instituteName || 'SAGE University, Indore';
  const deptName      = tt.department   || 'Computer Science & Engineering';
  const session       = tt.session      || 'Jan-June 2026';
  const program       = tt.program      || 'B.Tech';
  const semester      = tt.semester     || '';
  const section       = tt.section      || 'A';
  const roomNo        = tt.roomNo       || '101';
  const shift         = tt.shift        || 'FIRST';
  const today         = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'numeric', year:'numeric' });

  const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"/><title>${tt.name}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument>
<o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings>
</xml><![endif]-->
<style>
  @page { size: A4 landscape; margin: 1.2cm; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; }
  .center { text-align: center; }
  h2 { text-align: center; font-size: 13pt; margin: 0; font-weight: bold; }
  h3 { text-align: center; font-size: 11pt; margin: 2px 0; font-weight: bold; }
  p.session { text-align: center; font-size: 9.5pt; margin: 2px 0 6px; }
  .meta-table { width:100%; border-collapse:collapse; margin-bottom:4px; font-size:9pt; }
  .meta-table td { padding: 2px 4px; }
  table.tt { width: 100%; border-collapse: collapse; }
  table.tt th, table.tt td { border: 1px solid #9ca3af; padding: 3px 5px; font-size: 8.5pt; }
  .legend-hdr td { background: #e5e7eb; font-weight: bold; font-size: 8.5pt; text-align: center; border: 1px solid #9ca3af; padding: 3px 5px; }
  .sign-table { width:100%; margin-top:18px; font-size:9pt; }
  .sign-table td { padding: 2px 10px; }
</style>
</head>
<body>
  <h2>${instituteName}</h2>
  <h3>${deptName}</h3>
  <p class="session">Class Time Table Session ${session}</p>
  <table class="meta-table">
    <tr>
      <td><b>Name of Institute:</b> ${instituteName.split(',')[0]}</td>
      <td style="text-align:center;"><b>w.e.f</b> ${today}</td>
      <td style="text-align:right;"><b>Room No.</b> ${roomNo}</td>
    </tr>
    <tr>
      <td><b>Program:</b> <u>${program}</u></td>
      <td style="text-align:center;"><b>Semester:</b> ${semester}</td>
      <td style="text-align:center;"><b>Section:</b> ${section}</td>
      <td style="text-align:right;"><b>Shift:</b> ${shift}</td>
    </tr>
  </table>
  <table class="tt">
    ${hdr1}${hdr2}${hdr3}
    ${bodyRows}
    <tr class="legend-hdr">
      <td style="text-align:center;border:1px solid #9ca3af;font-weight:bold;">CODE</td>
      <td colspan="3" style="border:1px solid #9ca3af;font-weight:bold;">SUBJECT</td>
      <td style="text-align:center;border:1px solid #9ca3af;font-weight:bold;">ABB</td>
      <td colspan="4" style="border:1px solid #9ca3af;font-weight:bold;">NAME OF FACULTY</td>
      <td style="text-align:center;border:1px solid #9ca3af;font-weight:bold;">ABB</td>
      <td style="border:1px solid #9ca3af;"></td>
    </tr>
    ${legendRows}
  </table>
  <table class="sign-table">
    <tr>
      <td><b>Prepared By:</b><br/><br/>_______________</td>
      <td style="text-align:center;"><b>Checked By:</b><br/><br/>_______________</td>
      <td style="text-align:center;"><b>Head of Department</b><br/>${deptName}<br/>_______________</td>
      <td style="text-align:right;"><b>Approved By:</b><br/><br/>_______________</td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${tt.name.replace(/\s+/g, '_')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Views() {
  const [expandedId, setExpandedId] = useState(null);
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const { data: timetables = [], isLoading } = useQuery({
    queryKey: ['timetables'],
    queryFn: () => base44.entities.Timetable.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Timetable.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['timetables'] }); notify('Deleted', 'Timetable removed'); },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Timetables</h1>
          <p className="text-sm text-muted-foreground">{timetables.length} timetable{timetables.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      {timetables.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="font-medium text-muted-foreground">No saved timetables yet</p>
          <p className="text-sm text-muted-foreground mt-1">Generate and save a timetable first</p>
        </Card>
      ) : (
        <AnimatePresence>
          {timetables.map(tt => (
            <motion.div key={tt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  {/* Left: icon + info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      {/* Title: Program CSE - Sem X - Section Y */}
                      <p className="font-bold text-base text-foreground">
                        {[
                          tt.program || tt.name?.split(' ')[0],
                          tt.department ? tt.department.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) : null,
                          tt.semester ? `Sem ${tt.semester}` : null,
                          tt.section ? `Section ${tt.section}` : null,
                        ].filter(Boolean).join(' - ')}
                      </p>
                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {tt.program && (
                          <span className="px-2.5 py-0.5 rounded-full border border-border text-xs text-foreground font-medium bg-background">{tt.program}</span>
                        )}
                        {tt.roomNo && (
                          <span className="px-2.5 py-0.5 rounded-full border border-border text-xs text-foreground font-medium bg-background">Room {tt.roomNo}</span>
                        )}
                        {tt.shift && (
                          <span className="px-2.5 py-0.5 rounded-full border border-border text-xs text-foreground font-medium bg-background">{tt.shift} Shift</span>
                        )}
                        {tt.conflicts?.length > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            <AlertTriangle className="w-3 h-3 inline mr-0.5" />{tt.conflicts.length} conflict{tt.conflicts.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {/* Updated date */}
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Updated {new Date(tt.updated_date || tt.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  {/* Right: action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" title="Download DOCX" onClick={() => exportTimetableDocx(tt)}
                      className="text-muted-foreground hover:text-primary">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="View" onClick={() => setExpandedId(expandedId === tt.id ? null : tt.id)}
                      className="text-primary hover:text-primary">
                      {expandedId === tt.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(tt._id || tt.id); }}
                      disabled={deleteMutation.isPending}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === tt.id && tt.schedule && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border">
                      <div className="p-4">
                        <TimetableGrid
                          schedule={tt.schedule}
                          title={[tt.program, tt.semester ? `Semester ${tt.semester}` : null, tt.section ? `Section ${tt.section}` : null].filter(Boolean).join(' - ')}
                          subtitle={[tt.department, tt.shift ? `${tt.shift} Shift` : null].filter(Boolean).join(' | ')}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}