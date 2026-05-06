import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Save, AlertTriangle, Loader2, Settings2, Download, X, Sparkles, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateTimetable, autoFixTimetable } from '@/lib/timetableGenerator';
import { useNotification } from '@/components/shared/NotificationToast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ConfigureDialog from '@/components/timetable/ConfigureDialog';
import DraggableTimetableGrid from '@/components/timetable/DraggableTimetableGrid';
import ConstraintsModal from '@/components/timetable/ConstraintsModal';
import FacultySelectionDialog from '@/components/timetable/FacultySelectionDialog';

const DAYS = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_LABELS = ['1 LECTURE', '2 LECTURE', '3 LECTURE', '4 LECTURE', 'LUNCH', '5 LECTURE', '6 LECTURE', '7 LECTURE', '8 LECTURE', '9 LECTURE'];
const TIME_RANGES = ['8:50 To 9:20', '9:20 To 10:10', '10:10 To 11:00', '11:00 To 11:50', '11:50 To 12:35', '12:20 To 13:10', '13:10 To 14:00', '14:00 To 14:50', '14:50 To 15:40', '15:40 To 16:30'];
const LUNCH_SLOT = 4;

const SLOT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-teal-100 border-teal-300 text-teal-800',
];

const DEFAULT_CONFIG = {
  instituteName: 'SAGE University, Indore',
  departmentName: 'Computer Science & Engineering',
  session: 'Jan-June 2026',
  program: 'B.Tech',
  section: 'A',
  semester: 'IV',
  roomNo: '101',
  shift: 'FIRST',
  date: new Date().toLocaleDateString('en-GB'),
  preparedBy: '',
  checkedBy: '',
  approvedBy: '',
  lecturesPerWeek: 20,
  durationMinutes: 50,
  lecturesPerDay: 6,
  workingDays: 5,
  dayStart: '08:50',
  dayEnd: '16:30',
  lunchStart: '11:50',
  lunchEnd: '12:20',
  maxHoursPerFaculty: 20,
  maxConsecutiveClasses: 3,
};

function exportCurrentDocx(generated, config, subjects, faculty) {
  if (!generated) return;
  const schedule     = generated.schedule || [];
  const DAYS_SHORT   = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
  const FULL_DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const getEntry     = (day, slot) => schedule.find(s => s.day === day && s.slot === slot);

  const SLOT_LABELS  = ['1 LECTURE','2 LECTURE','3 LECTURE','4 LECTURE','LUNCH','5 LECTURE','6 LECTURE','7 LECTURE','8 LECTURE','9 LECTURE'];
  const TIME_RANGES  = ['8:30 To 09:20','9:20 To 10:10','10:10 To 11:00','11:00 To 11:50','11:50 To 12:20 / 11:50 To 12:40','12:20 To 13:10 / 12:40 To 13:10','13:10 To 14:00','14:00 To 14:50','14:50 To 15:40','15:40 To 16:30'];

  // Header row 1 – slot numbers
  let hdr1 = `<tr><th rowspan="3" style="background:#e5e7eb;font-weight:bold;">Slot<br/>No.</th>`;
  for (let i = 0; i < 10; i++) {
    const isLunch = i === 4;
    hdr1 += `<th style="background:${isLunch?'#fff7ed':'#e5e7eb'};color:${isLunch?'#ea580c':'#111'};font-weight:bold;">${i+1}</th>`;
  }
  hdr1 += `</tr>`;

  // Header row 2 – lecture labels
  let hdr2 = `<tr>`;
  for (let i = 0; i < 10; i++) {
    const isLunch = i === 4;
    hdr2 += `<th style="background:${isLunch?'#fff7ed':'#e5e7eb'};color:${isLunch?'#ea580c':'#1d4ed8'};font-size:8pt;">${SLOT_LABELS[i]}</th>`;
  }
  hdr2 += `</tr>`;

  // Header row 3 – time ranges
  let hdr3 = `<tr>`;
  for (let i = 0; i < 10; i++) {
    const isLunch = i === 4;
    hdr3 += `<th style="background:${isLunch?'#fff7ed':'#f9fafb'};color:${isLunch?'#ea580c':'#555'};font-size:7.5pt;font-weight:normal;">${TIME_RANGES[i]}</th>`;
  }
  hdr3 += `</tr>`;

  // Day rows
  let bodyRows = '';
  DAYS_SHORT.forEach((day, di) => {
    bodyRows += `<tr><td style="font-weight:bold;background:#e5e7eb;text-align:center;">${day}</td>`;
    for (let s = 0; s < 10; s++) {
      if (s === 4) { bodyRows += `<td style="background:#fff7ed;color:#ea580c;text-align:center;font-weight:bold;">LUNCH</td>`; continue; }
      const mapped = s < 4 ? s : s - 1;
      const e = getEntry(FULL_DAYS[di], mapped);
      bodyRows += e
        ? `<td style="text-align:center;font-size:8.5pt;"><b>${e.subject_code}(${getAbbr(e.faculty_name)})</b><br/><span style="font-size:7.5pt;">Room ${config.roomNo}</span></td>`
        : `<td style="text-align:center;color:#9ca3af;">-</td>`;
    }
    bodyRows += `</tr>`;
  });

  // Legend rows
  const legendRows = (subjects || []).map((s, i) => {
    const f = (faculty || [])[i % Math.max((faculty||[]).length, 1)];
    return `<tr>
      <td style="text-align:center;font-weight:bold;border:1px solid #9ca3af;">${s.code}</td>
      <td colspan="3" style="border:1px solid #9ca3af;">${s.name}</td>
      <td style="text-align:center;border:1px solid #9ca3af;">${s.code?.slice(0,4)||''}</td>
      <td colspan="4" style="border:1px solid #9ca3af;">${f?.name||'-'}</td>
      <td style="text-align:center;border:1px solid #9ca3af;">${f?getAbbr(f.name):'-'}</td>
      <td style="border:1px solid #9ca3af;"></td>
    </tr>`;
  }).join('');

  const name   = `${config.program} ${config.semester} - ${config.section}`;
  const today  = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'numeric', year:'numeric' });

  const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"/><title>${name}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument>
<o:OfficeDocumentSettings><o:AllowPNG/></o:OfficeDocumentSettings>
</xml><![endif]-->
<style>
  @page { size: A4 landscape; margin: 1.2cm; }
  body { font-family: Arial, sans-serif; font-size: 9.5pt; }
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
  <h2>${config.instituteName}</h2>
  <h3>${config.departmentName}</h3>
  <p class="session">Class Time Table Session ${config.session}</p>
  <table class="meta-table">
    <tr>
      <td><b>Name of Institute:</b> ${config.instituteName.split(',')[0]}</td>
      <td style="text-align:center;"><b>w.e.f</b> ${today}</td>
      <td style="text-align:right;"><b>Room No.</b> ${config.roomNo}</td>
    </tr>
    <tr>
      <td><b>Program:</b> <u>${config.program}</u></td>
      <td style="text-align:center;"><b>Semester:</b> ${config.semester}</td>
      <td style="text-align:center;"><b>Section:</b> ${config.section}</td>
      <td style="text-align:right;"><b>Shift:</b> ${config.shift}</td>
    </tr>
  </table>
  <table class="tt">
    ${hdr1}${hdr2}${hdr3}
    ${bodyRows}
    <tr>
      <td style="text-align:center;background:#e5e7eb;font-weight:bold;border:1px solid #9ca3af;">CODE</td>
      <td colspan="3" style="background:#e5e7eb;font-weight:bold;border:1px solid #9ca3af;">SUBJECT</td>
      <td style="text-align:center;background:#e5e7eb;font-weight:bold;border:1px solid #9ca3af;">ABB</td>
      <td colspan="4" style="background:#e5e7eb;font-weight:bold;border:1px solid #9ca3af;">NAME OF FACULTY</td>
      <td style="text-align:center;background:#e5e7eb;font-weight:bold;border:1px solid #9ca3af;">ABB</td>
      <td style="background:#e5e7eb;border:1px solid #9ca3af;"></td>
    </tr>
    ${legendRows}
  </table>
  <table class="sign-table">
    <tr>
      <td><b>Prepared By:</b><br/><br/>_______________</td>
      <td style="text-align:center;"><b>Checked By:</b><br/><br/>_______________</td>
      <td style="text-align:center;"><b>Head of Department</b><br/>${config.departmentName}<br/>_______________</td>
      <td style="text-align:right;"><b>Approved By:</b><br/><br/>_______________</td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${name.replace(/\s+/g, '_')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function getAbbr(name = '') {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Timetable() {
  const [generated, setGenerated] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfigure, setShowConfigure] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [editCell, setEditCell] = useState(null);
  const [addCell, setAddCell] = useState(null);
  const [showConstraints, setShowConstraints] = useState(false);
  const [showFacultySelection, setShowFacultySelection] = useState(false);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);

  // Filter dropdowns
  const COURSE_OPTIONS = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'MBA'];
  const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E'];
  const [filterYear, setFilterYear] = useState('2nd Year');
  const [selectedRoom, setSelectedRoom] = useState('');
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const { data: faculty = [] } = useQuery({ queryKey: ['faculty'], queryFn: () => base44.entities.Faculty.list() });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => base44.entities.Room.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => base44.entities.Subject.list() });

  const subjectColorMap = {};
  subjects.forEach((s, i) => { subjectColorMap[s.code] = SLOT_COLORS[i % SLOT_COLORS.length]; });

  const handleGenerate = () => {
    if (subjects.length === 0 || faculty.length === 0 || rooms.length === 0) {
      notify('Missing Data', 'Please add faculty, rooms, and subjects first', 'destructive');
      return;
    }
    setShowConstraints(true);
  };

  const runGenerate = (constraints) => {
    setIsGenerating(true);
    setTimeout(() => {
      // Filter faculty to only use selected ones, or all if none selected
      const facultyToUse = selectedFacultyIds.length > 0 
        ? faculty.filter(f => selectedFacultyIds.includes(f.id))
        : faculty;
      
      const result = generateTimetable(subjects, facultyToUse, rooms, constraints);
      setGenerated(result);
      setSaveName(`${config.program} ${config.semester} - ${config.section}`);
      setIsGenerating(false);
      if (result.conflicts.length > 0) {
        notify('Generated with warnings', `${result.conflicts.length} conflict(s) detected`);
      } else {
        notify('Success', 'Timetable generated without conflicts!');
      }
    }, 600);
  };

  const handleSave = async () => {
    if (!generated || !saveName.trim()) return;
    setSaving(true);
    await base44.entities.Timetable.create({
      name: saveName,
      semester: config.semester,
      department: config.departmentName,
      schedule: generated.schedule,
      conflicts: generated.conflicts,
      program: config.program,
      section: config.section,
      roomNo: config.roomNo,
      shift: config.shift,
    });
    queryClient.invalidateQueries({ queryKey: ['timetables'] });
    notify('Saved', 'Timetable saved to Views');
    setSaving(false);
  };

  const getEntry = (dayFull, slotIdx) => generated?.schedule?.find(s => s.day === dayFull && s.slot === slotIdx);

  // Room conflict validation: check if a room is already used at that day+slot
  const isRoomConflict = (day, slot, roomName, excludeEntry = null) => {
    return (generated?.schedule || []).some(s =>
      s.day === day && s.slot === slot && s.room_name === roomName &&
      !(excludeEntry && s.day === excludeEntry.day && s.slot === excludeEntry.slot)
    );
  };

  const removeCell = (day, slot) => {
    setGenerated(g => ({ ...g, schedule: g.schedule.filter(s => !(s.day === day && s.slot === slot)) }));
  };

  // kept for possible future use
  const replaceCell_unused = (day, slot) => {
    const otherSubjects = subjects.filter(s => {
      const current = getEntry(day, slot);
      return !current || s.code !== current.subject_code;
    });
    if (otherSubjects.length === 0) return;
    const next = otherSubjects[Math.floor(Math.random() * otherSubjects.length)];
    const nextFaculty = faculty[Math.floor(Math.random() * faculty.length)];
    setGenerated(g => ({
      ...g,
      schedule: g.schedule.map(s =>
        s.day === day && s.slot === slot
          ? { ...s, subject_name: next.name, subject_code: next.code, faculty_name: nextFaculty?.name || s.faculty_name }
          : s
      ),
    }));
  };

  const saveEditCell = (day, slot, subjectCode, facultyName, roomName) => {
    const subj = subjects.find(s => s.code === subjectCode);
    setGenerated(g => ({
      ...g,
      schedule: g.schedule.map(s =>
        s.day === day && s.slot === slot
          ? { ...s, subject_name: subj?.name || s.subject_name, subject_code: subjectCode, faculty_name: facultyName, room_name: roomName || s.room_name }
          : s
      ),
    }));
    setEditCell(null);
  };

  const saveAddCell = (day, slot, subjectCode, facultyName, roomName, isLab = false) => {
    const subj = subjects.find(s => s.code === subjectCode);
    if (!subj) return;
    setGenerated(g => ({
      ...g,
      schedule: [
        ...g.schedule,
        { day, slot, subject_name: subj.name, subject_code: subjectCode, faculty_name: facultyName, room_name: roomName, is_lab: isLab },
      ],
    }));
    if (!isLab) setAddCell(null);
  };

  const swapCells = (srcDay, srcSlot, dstDay, dstSlot) => {
    setGenerated(g => {
      const schedule = [...g.schedule];
      const srcIdx = schedule.findIndex(s => s.day === srcDay && s.slot === srcSlot);
      const dstIdx = schedule.findIndex(s => s.day === dstDay && s.slot === dstSlot);
      if (srcIdx === -1) return g;
      const srcEntry = { ...schedule[srcIdx], day: dstDay, slot: dstSlot };
      if (dstIdx === -1) {
        // destination is empty — just move
        const newSchedule = schedule.filter((_, i) => i !== srcIdx);
        newSchedule.push(srcEntry);
        return { ...g, schedule: newSchedule };
      }
      // swap both
      const dstEntry = { ...schedule[dstIdx], day: srcDay, slot: srcSlot };
      return {
        ...g,
        schedule: schedule.map((s, i) => {
          if (i === srcIdx) return srcEntry;
          if (i === dstIdx) return dstEntry;
          return s;
        }),
      };
    });
  };

  const canGenerate = subjects.length > 0 && faculty.length > 0 && rooms.length > 0;

  const autoFix = () => {
    if (!generated) return;
    const result = autoFixTimetable(generated.schedule, generated.conflicts, subjects, faculty, rooms);
    setGenerated(result);
  };

  const regenerateConflictsOnly = () => {
    if (!generated || !generated.conflicts?.length) return;
    // Remove conflicted entries and re-run generation for missing credits
    const result = autoFixTimetable(generated.schedule, generated.conflicts, subjects, faculty, rooms);
    setGenerated(result);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Timetable</h1>
            <p className="text-xs text-muted-foreground">{config.instituteName} · Session {config.session}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfigure(true)}>
            <Settings2 className="w-4 h-4 mr-1.5" />Configure
          </Button>
          {generated && (
            <Button variant="outline" size="sm" onClick={() => exportCurrentDocx(generated, config, subjects, faculty)}>
            <Download className="w-4 h-4 mr-1.5" />Export DOCX
          </Button>
          )}
          <Button size="sm" onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
            Auto Generate
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={config.program} onValueChange={v => setConfig(c => ({ ...c, program: v }))}>
          <SelectTrigger className="h-8 text-sm bg-primary/10 border-0 text-primary font-medium w-auto min-w-[100px] focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COURSE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="h-8 text-sm bg-primary/10 border-0 text-primary font-medium w-auto min-w-[110px] focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={config.semester} onValueChange={v => setConfig(c => ({ ...c, semester: v }))}>
          <SelectTrigger className="h-8 text-sm bg-primary/10 border-0 text-primary font-medium w-auto min-w-[130px] focus:ring-0">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {SEMESTER_OPTIONS.map(o => <SelectItem key={o} value={o}>Semester {o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={config.section} onValueChange={v => setConfig(c => ({ ...c, section: v }))}>
          <SelectTrigger className="h-8 text-sm bg-primary/10 border-0 text-primary font-medium w-auto min-w-[120px] focus:ring-0">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            {SECTION_OPTIONS.map(o => <SelectItem key={o} value={o}>Section {o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedRoom} onValueChange={v => { setSelectedRoom(v); setConfig(c => ({ ...c, roomNo: v })); }}>
          <SelectTrigger className="h-8 text-sm bg-primary/10 border-0 text-primary font-medium w-auto min-w-[120px] focus:ring-0">
            <SelectValue placeholder="Room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFacultySelection(true)}
          className="h-8 text-sm"
        >
          {selectedFacultyIds.length > 0 
            ? `${selectedFacultyIds.length} Faculty Selected`
            : 'Select Faculty'
          }
        </Button>
        {generated && (
          <button onClick={() => setGenerated(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive px-2">
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>

      {/* Genie Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="relative flex flex-col items-center gap-6">
              {/* Genie lamp shimmer */}
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 0.95, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl select-none">🪔</motion.div>
              {/* Floating stars */}
              {[...Array(6)].map((_, i) => (
                <motion.div key={i}
                  className="absolute text-2xl"
                  style={{ left: `${20 + i * 12}%`, top: `${20 + (i % 3) * 25}%` }}
                  animate={{ y: [-10, -30, -10], opacity: [0, 1, 0], rotate: [0, 180, 360] }}
                  transition={{ duration: 1.2 + i * 0.2, repeat: Infinity, delay: i * 0.18 }}>
                  {['✨','⭐','💫','🌟','✨','⭐'][i]}
                </motion.div>
              ))}
              {/* Smoke wisps */}
              {[...Array(3)].map((_, i) => (
                <motion.div key={i}
                  className="absolute w-2 h-8 rounded-full bg-primary/30"
                  style={{ left: `${44 + i * 6}%`, top: '-20px' }}
                  animate={{ y: [-10, -50], opacity: [0.6, 0], scaleX: [1, 2.5] }}
                  transition={{ duration: 1 + i * 0.3, repeat: Infinity, delay: i * 0.25 }} />
              ))}
              <div className="text-center">
                <p className="text-xl font-bold text-primary">The Genie is working its magic…</p>
                <p className="text-sm text-muted-foreground mt-1">Crafting the perfect timetable for you ✨</p>
              </div>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Optimising slots…
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit & Status Dashboard */}
      {generated && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Weekly Credit Budget */}
          <div className="border border-border rounded-xl p-3 bg-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Weekly Credit Budget</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-primary">{generated.weekCreditsUsed ?? '—'}</span>
              <span className="text-sm text-muted-foreground mb-0.5">/ {generated.weekCreditsLimit ?? 15} credits</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, ((generated.weekCreditsUsed ?? 0) / (generated.weekCreditsLimit ?? 15)) * 100)}%` }} />
            </div>
          </div>
          {/* Subject Status */}
          <div className="border border-border rounded-xl p-3 bg-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subject Status</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {Object.entries(generated.subjectStatus || {}).map(([code, s]) => (
                <div key={code} className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-[55%]">{code}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    s.status === 'completed' ? 'bg-green-100 text-green-700' :
                    s.status === 'partial'   ? 'bg-amber-100 text-amber-700' :
                    s.status === 'skipped'   ? 'bg-red-100 text-red-600' :
                                               'bg-muted text-muted-foreground'
                  }`}>{s.status === 'completed' ? '✓ Completed' : s.status === 'partial' ? `${s.assigned}/${s.required}` : s.status === 'skipped' ? 'Skipped' : 'Pending'}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Faculty Status */}
          <div className="border border-border rounded-xl p-3 bg-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Faculty Load</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {Object.entries(generated.facultyStatus || {}).map(([name, f]) => (
                <div key={name} className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-[55%]">{name.split(' ').slice(-1)[0]}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    f.status === 'engaged' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                  }`}>{f.hoursUsed}h / {f.hoursCap}h {f.status === 'engaged' ? '🔒 Engaged' : '✓ Free'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conflicts */}
      {generated?.conflicts?.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/30 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">Conflicts Detected</p>
            <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">
              {generated.conflicts.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={autoFix}
              className="border-amber-400 text-amber-600 hover:bg-amber-50">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />Auto Fix
            </Button>
            <Button size="sm" variant="outline" onClick={regenerateConflictsOnly}
              className="border-primary/40 text-primary hover:bg-primary/5">
              <Zap className="w-3.5 h-3.5 mr-1.5" />Fix &amp; Fill Credits
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {!generated ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="border border-border rounded-xl p-16 text-center bg-card">
            <Wand2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="font-semibold text-muted-foreground">No timetable generated yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {canGenerate ? 'Click "Auto Generate" to create a timetable' : 'Add faculty, rooms, and subjects first'}
            </p>
            <Button className="mt-4" size="sm" variant="outline" onClick={() => setShowConfigure(true)}>
              <Settings2 className="w-4 h-4 mr-2" />Set Constraints First
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              {/* University Header */}
              <div className="text-center py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">{config.instituteName}</h2>
                <p className="text-xs text-primary mt-0.5">Class Time Table Session {config.session}</p>
              </div>
              <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border text-xs">
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Name of Institute:</p><p className="font-semibold mt-0.5">{config.instituteName}</p></div>
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Name of Department:</p><p className="font-semibold mt-0.5 text-primary">{config.departmentName}</p></div>
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Date:</p><p className="font-semibold mt-0.5">{config.date}</p></div>
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Room No.:</p><p className="font-semibold mt-0.5">{config.roomNo}</p></div>
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Program:</p><p className="font-semibold mt-0.5">{config.program}</p></div>
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Semester:</p><p className="font-semibold mt-0.5">{config.semester}</p></div>
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Section:</p><p className="font-semibold mt-0.5">{config.section}</p></div>
                <div><p className="text-muted-foreground uppercase text-[10px] tracking-wide font-medium">Shift:</p><p className="font-semibold mt-0.5">{config.shift}</p></div>
              </div>

              {/* Timetable Grid — drag & drop */}
              <DraggableTimetableGrid
                schedule={generated.schedule}
                subjectColorMap={subjectColorMap}
                onEdit={(day, slot, entry) => setEditCell({ day, slot, entry })}
                onRemove={removeCell}
                onSwap={swapCells}
                onAdd={(day, slot, label) => setAddCell({ day, slot, label })}
              />

              {/* Subject Legend */}
              <div className="px-4 py-3 border-t border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-1.5 font-semibold uppercase tracking-wide text-[10px] w-20">Code</th>
                      <th className="text-left py-1.5 font-semibold uppercase tracking-wide text-[10px]">Subject</th>
                      <th className="text-left py-1.5 font-semibold uppercase tracking-wide text-[10px] w-20">Abb.</th>
                      <th className="text-left py-1.5 font-semibold uppercase tracking-wide text-[10px]">Name of Faculty</th>
                      <th className="text-left py-1.5 font-semibold uppercase tracking-wide text-[10px] w-16">Abb.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.filter(s => (generated?.schedule || []).some(e => e.subject_code === s.code)).map((s, i) => {
                      const schedEntries = (generated?.schedule || []).filter(e => e.subject_code === s.code);
                      const assignedFacultyName = schedEntries[0]?.faculty_name;
                      const assignedFaculty = faculty.find(f => f.name === assignedFacultyName) || faculty[i % Math.max(faculty.length, 1)];
                      const color = subjectColorMap[s.code] || SLOT_COLORS[0];
                      return (
                        <tr key={s.id} className="border-b border-border last:border-0">
                          <td className="py-1.5 text-primary font-medium">{s.code}</td>
                          <td className="py-1.5 font-medium">{s.name}</td>
                          <td className="py-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${color}`}>{s.code?.slice(0, 2)}</span>
                          </td>
                          <td className="py-1.5 text-muted-foreground">{assignedFaculty?.name || '—'}</td>
                          <td className="py-1.5 font-medium">{assignedFaculty ? getAbbr(assignedFaculty.name) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save Section */}
              <div className="px-4 py-3 border-t border-border bg-muted/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <Label htmlFor="ttname" className="text-xs font-medium">Save As (Course · Semester · Section)</Label>
                    <Input id="ttname" value={saveName} onChange={e => setSaveName(e.target.value)}
                      placeholder="e.g. B.Tech IV - A" className="mt-1 h-8 text-sm" />
                  </div>
                  <Button onClick={handleSave} disabled={saving || !saveName.trim()} size="sm" className="mt-4 sm:mt-0">
                    {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save to Views
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-3 border-t border-border px-6 py-4 text-xs text-muted-foreground">
                <div>
                  <p>Prepared By:</p>
                  <p className="font-semibold text-foreground mt-1">{config.preparedBy || '_______________'}</p>
                  <div className="mt-3 border-b border-border w-32" />
                </div>
                <div className="text-center">
                  <p>Checked By:</p>
                  <p className="font-semibold text-foreground mt-1">{config.checkedBy || '_______________'}</p>
                  <div className="mt-3 border-b border-border w-32 mx-auto" />
                </div>
                <div className="text-right">
                  <p>Approved By:</p>
                  <p className="font-semibold text-foreground mt-1">{config.approvedBy || '_______________'}</p>
                  <div className="mt-3 border-b border-border w-32 ml-auto" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfigureDialog
        open={showConfigure}
        onOpenChange={setShowConfigure}
        config={config}
        onSave={setConfig}
      />

      <ConstraintsModal
        open={showConstraints}
        onOpenChange={setShowConstraints}
        faculty={faculty}
        rooms={rooms}
        subjects={subjects}
        onGenerate={runGenerate}
      />

      <FacultySelectionDialog
        open={showFacultySelection}
        onOpenChange={setShowFacultySelection}
        faculty={faculty}
        selectedFaculty={selectedFacultyIds}
        onSelectionChange={setSelectedFacultyIds}
      />

      {/* Edit Cell Dialog */}
      {editCell && (
        <EditCellDialog
          entry={editCell.entry}
          day={editCell.day}
          slot={editCell.slot}
          subjects={subjects}
          faculty={faculty}
          rooms={rooms}
          onSave={saveEditCell}
          onClose={() => setEditCell(null)}
        />
      )}

      {/* Add Class Dialog */}
      {addCell && (
        <AddCellDialog
          day={addCell.day}
          slot={addCell.slot}
          label={addCell.label}
          subjects={subjects}
          faculty={faculty}
          rooms={rooms}
          schedule={generated?.schedule || []}
          onSave={saveAddCell}
          onClose={() => setAddCell(null)}
        />
      )}
    </div>
  );
}

function EditCellDialog({ entry, day, slot, subjects, faculty, rooms, onSave, onClose }) {
  const [subjectCode, setSubjectCode] = useState(entry.subject_code);
  const [facultyName, setFacultyName] = useState(entry.faculty_name || '');
  const [roomName, setRoomName] = useState(entry.room_name || '');

  const SLOT_LABELS_FULL = ['1 LECTURE', '2 LECTURE', '3 LECTURE', '4 LECTURE', 'LUNCH', '5 LECTURE', '6 LECTURE', '7 LECTURE', '8 LECTURE', '9 LECTURE'];
  const TIME_RANGES_FULL = ['8:50 To 9:20', '9:20 To 10:10', '10:10 To 11:00', '11:00 To 11:50', '11:50 To 12:35', '12:20 To 13:10', '13:10 To 14:00', '14:00 To 14:50', '14:50 To 15:40', '15:40 To 16:30'];
  const slotDisplayIdx = slot < 4 ? slot : slot + 1;
  const slotLabel = SLOT_LABELS_FULL[slotDisplayIdx] || `Slot ${slot + 1}`;
  const timeLabel = TIME_RANGES_FULL[slotDisplayIdx] || '';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-primary">✏️</span>
            Edit — {day.toUpperCase()} · {slotLabel}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{timeLabel}</p>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Subject</Label>
            <Select value={subjectCode} onValueChange={setSubjectCode}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select a subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.code}>{s.code} — {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Faculty</Label>
            <Select value={facultyName} onValueChange={setFacultyName}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {faculty.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Room</Label>
            <Select value={roomName} onValueChange={setRoomName}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                {rooms.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={() => onSave(day, slot, subjectCode, facultyName, roomName)}
              disabled={!subjectCode}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Credit rule engine helpers
function getCreditRule(subject) {
  const credits = Number(subject?.credits);
  if (credits === 2) return { lectures: 0, lab: true, description: '2 Credits: 1 Lab (2 consecutive slots)' };
  if (credits === 3) return { lectures: 3, lab: false, description: '3 Credits: 3 Lectures only, no labs' };
  if (credits === 4) return { lectures: 4, lab: true, description: '4 Credits: up to 4 Lectures + 1 optional Lab' };
  return null;
}

function getUsedCounts(schedule, subjectCode) {
  const entries = schedule.filter(s => s.subject_code === subjectCode);
  return {
    lectures: entries.filter(s => !s.is_lab).length,
    labs: entries.filter(s => s.is_lab).length,
    total: entries.length,
  };
}

function AddCellDialog({ day, slot, label, subjects, faculty, rooms, onSave, onClose, schedule = [] }) {
  const [subjectCode, setSubjectCode] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isLab, setIsLab] = useState(false);
  const [error, setError] = useState('');

  const selectedSubject = subjects.find(s => s.code === subjectCode);
  const rule = getCreditRule(selectedSubject);
  const used = subjectCode ? getUsedCounts(schedule, subjectCode) : { lectures: 0, labs: 0, total: 0 };

  const handleSubjectChange = (code) => {
    setSubjectCode(code);
    setError('');
    const subj = subjects.find(s => s.code === code);
    const r = getCreditRule(subj);
    setIsLab(r && Number(subj?.credits) === 2); // 2-credit always lab
  };

  const validate = () => {
    if (!rule) return true;
    const credits = Number(selectedSubject?.credits);
    if (credits === 2) {
      if (used.labs >= 1) { setError('2-credit subject already has its lab allocated.'); return false; }
    } else if (credits === 3) {
      if (isLab) { setError('3-credit subjects cannot have labs — lectures only.'); return false; }
      if (used.lectures >= 3) { setError('3-credit subject: all 3 lectures already allocated.'); return false; }
    } else if (credits === 4) {
      if (isLab && used.labs >= 1) { setError('4-credit subject already has its lab allocated.'); return false; }
      if (!isLab && used.lectures >= 4) { setError('4-credit subject: all 4 lectures already allocated.'); return false; }
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (isLab) {
      onSave(day, slot, subjectCode, facultyName, roomName, true);
      onSave(day, slot + 1, subjectCode, facultyName, roomName, true);
    } else {
      onSave(day, slot, subjectCode, facultyName, roomName, false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-primary">＋</span>
            Add Class — {label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Subject</Label>
            <Select value={subjectCode} onValueChange={handleSubjectChange}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select a subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.code}>{s.code} — {s.name} ({s.credits || '?'}cr)</SelectItem>)}
              </SelectContent>
            </Select>
            {rule && <p className="text-[11px] text-muted-foreground mt-1">📋 {rule.description} • Lectures used: {used.lectures} | Labs: {used.labs}</p>}
          </div>

          {rule && rule.lab && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
              <input type="checkbox" id="islab" checked={isLab}
                disabled={Number(selectedSubject?.credits) === 2}
                onChange={e => { setIsLab(e.target.checked); setError(''); }}
                className="w-4 h-4 accent-primary" />
              <Label htmlFor="islab" className="text-sm cursor-pointer">
                Lab session (2 consecutive slots)
                {Number(selectedSubject?.credits) === 2 && <span className="ml-1 text-xs text-primary font-medium">(required)</span>}
              </Label>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Faculty</Label>
            <Select value={facultyName} onValueChange={setFacultyName}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select faculty" /></SelectTrigger>
              <SelectContent>
                {faculty.map(f => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Room</Label>
            <Select value={roomName} onValueChange={setRoomName}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                {rooms.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!subjectCode}>
              {isLab ? 'Add Lab (2 slots)' : 'Add Class'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}