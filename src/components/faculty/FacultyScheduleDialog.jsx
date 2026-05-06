import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, GraduationCap, Building, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['8:50-9:40', '9:40-10:30', '10:30-11:20', '11:20-12:10', 'LUNCH', '12:50-1:40', '1:40-2:30', '2:30-3:20'];
const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'];
const SLOT_COLORS = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-pink-100 text-pink-800', 'bg-purple-100 text-purple-800'];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function FacultyScheduleDialog({ open, onOpenChange, faculty, timetables, colorIndex = 0 }) {
  if (!faculty) return null;

  // Collect all schedule entries for this faculty from all saved timetables
  const allEntries = [];
  (timetables || []).forEach(tt => {
    (tt.schedule || []).forEach(entry => {
      if (entry.faculty_name === faculty.name) {
        allEntries.push({ ...entry, timetableName: tt.name });
      }
    });
  });

  const getEntry = (day, slotIdx) => allEntries.find(e => e.day === day && e.slot === slotIdx);

  const subjectSet = [...new Set(allEntries.map(e => e.subject_name))];
  const subjectColorMap = {};
  subjectSet.forEach((s, i) => { subjectColorMap[s] = SLOT_COLORS[i % SLOT_COLORS.length]; });

  const totalHours = allEntries.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Full Schedule</DialogTitle>
        </DialogHeader>

        {/* Faculty Info */}
        <div className="flex items-start gap-4 p-4 bg-muted/40 rounded-xl">
          <div className={`w-14 h-14 rounded-full ${AVATAR_COLORS[colorIndex % AVATAR_COLORS.length]} flex items-center justify-center shrink-0`}>
            <span className="text-xl font-bold text-white">{getInitials(faculty.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-lg">{faculty.name}</p>
              <span className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground">{faculty.department}</p>
            {faculty.designation && <Badge variant="secondary" className="mt-1 text-xs">{faculty.designation}</Badge>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              {faculty.email && (
                <a href={`mailto:${faculty.email}`} className="flex items-center gap-1.5 text-primary hover:underline">
                  <Mail className="w-3.5 h-3.5" />{faculty.email}
                </a>
              )}
              {faculty.phone && (
                <a href={`tel:${faculty.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Phone className="w-3.5 h-3.5" />{faculty.phone}
                </a>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-primary">{totalHours}</p>
            <p className="text-xs text-muted-foreground">Total Slots</p>
          </div>
        </div>

        {/* Schedule Grid */}
        {allEntries.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>No schedule found. Generate and save a timetable first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[500px]">
              <thead>
                <tr>
                  <th className="border border-border px-2 py-2 bg-muted/50 text-left w-16">Day</th>
                  {TIME_SLOTS.map((t, i) => (
                    <th key={i} className={cn("border border-border px-1 py-1.5 text-center font-medium",
                      t === 'LUNCH' ? 'bg-orange-50 text-orange-500' : 'bg-muted/30')}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day}>
                    <td className="border border-border px-2 py-2 font-bold text-center bg-muted/20">{day.slice(0, 3).toUpperCase()}</td>
                    {TIME_SLOTS.map((_, slotIdx) => {
                      if (TIME_SLOTS[slotIdx] === 'LUNCH') {
                        return <td key={slotIdx} className="border border-border bg-orange-50 text-center text-orange-400 font-medium">☀</td>;
                      }
                      const mappedSlot = slotIdx < 4 ? slotIdx : slotIdx - 1;
                      const entry = getEntry(day, mappedSlot);
                      const color = entry ? (subjectColorMap[entry.subject_name] || SLOT_COLORS[0]) : '';
                      return (
                        <td key={slotIdx} className="border border-border px-1 py-1">
                          {entry && (
                            <div className={`rounded px-1 py-0.5 text-center ${color}`}>
                              <p className="font-bold text-[10px]">{entry.subject_code}</p>
                              <p className="text-[9px] opacity-70">{entry.room_name}</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Subject Legend */}
        {subjectSet.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {subjectSet.map((s, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded border ${subjectColorMap[s]}`}>{s}</span>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}