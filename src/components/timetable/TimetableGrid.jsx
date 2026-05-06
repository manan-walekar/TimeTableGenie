import React from 'react';
import { cn } from '@/lib/utils';

const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
const FULL_DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_COLS = [
  '08:30-09:20',
  '09:20-10:10',
  '10:10-11:00',
  '11:00-11:50',
  'LUNCH',
  '12:20-13:10',
  '13:10-14:00',
  '14:00-14:50',
  '14:50-15:40',
  '15:40-16:30',
];

const CELL_COLORS = [
  'bg-teal-100 text-teal-800',
  'bg-pink-100 text-pink-800',
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-orange-100 text-orange-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-cyan-100 text-cyan-800',
];

export default function TimetableGrid({ schedule, title, subtitle }) {
  // Assign a stable color per subject code
  const subjectColorMap = {};
  let colorIdx = 0;
  (schedule || []).forEach(entry => {
    if (entry.subject_code && !subjectColorMap[entry.subject_code]) {
      subjectColorMap[entry.subject_code] = CELL_COLORS[colorIdx % CELL_COLORS.length];
      colorIdx++;
    }
  });

  const getEntry = (day, slot) => (schedule || []).find(s => s.day === day && s.slot === slot);

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      {/* Dark header bar */}
      {(title || subtitle) && (
        <div className="bg-slate-800 px-4 py-3">
          {title && <p className="text-white font-bold text-sm">{title}</p>}
          {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-100 border-b border-border">
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-14 border-r border-border">DAY</th>
              {TIME_COLS.map((t, i) => (
                <th key={i} className={cn(
                  'px-2 py-2 text-center font-semibold whitespace-nowrap',
                  t === 'LUNCH' ? 'bg-yellow-50 text-yellow-600' : 'text-muted-foreground'
                )}>
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_SHORT.map((day, di) => (
              <tr key={day} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-bold text-center text-muted-foreground bg-slate-50 border-r border-border">{day}</td>
                {TIME_COLS.map((_, colIdx) => {
                  if (TIME_COLS[colIdx] === 'LUNCH') {
                    return (
                      <td key={colIdx} className="px-2 py-1 text-center bg-yellow-50">
                        <span className="text-yellow-600 font-semibold text-[11px]">LUNCH</span>
                      </td>
                    );
                  }
                  // map column index to slot index (skip lunch col at index 4)
                  const slotIdx = colIdx < 4 ? colIdx : colIdx - 1;
                  const entry = getEntry(FULL_DAYS[di], slotIdx);
                  const color = entry ? (subjectColorMap[entry.subject_code] || CELL_COLORS[0]) : '';
                  return (
                    <td key={colIdx} className="px-1 py-1">
                      {entry ? (
                        <div className={cn('rounded-lg px-2 py-2 text-center', color)}>
                          <p className="font-bold text-[12px] leading-tight">{entry.subject_code}</p>
                          <p className="text-[10px] leading-tight opacity-80 mt-0.5">
                            {entry.faculty_name
                              ? entry.faculty_name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0,3)
                              : ''}
                          </p>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}