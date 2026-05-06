import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

const COURSE_OPTIONS = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'MBA'];
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function AcademicContextSelector({ value = [], onChange }) {
  const [draft, setDraft] = useState({ course: '', year: '', semester: '', section: '' });

  const addMapping = () => {
    if (!draft.course || !draft.semester) return;
    onChange([...value, { ...draft }]);
    setDraft({ course: '', year: '', semester: '', section: '' });
  };

  const removeMapping = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Academic Mappings</Label>

      {/* Current Mappings */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((m, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {[m.course, m.year, `Sem ${m.semester}`, m.section && `Sec ${m.section}`].filter(Boolean).join(' · ')}
              <button onClick={() => removeMapping(i)} className="hover:text-destructive transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add New Mapping Row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">Course</Label>
          <Select value={draft.course} onValueChange={v => setDraft(d => ({ ...d, course: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>
              {COURSE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">Year</Label>
          <Select value={draft.year} onValueChange={v => setDraft(d => ({ ...d, year: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">Semester</Label>
          <Select value={draft.semester} onValueChange={v => setDraft(d => ({ ...d, semester: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              {SEMESTER_OPTIONS.map(o => <SelectItem key={o} value={o}>Sem {o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">Section</Label>
          <Select value={draft.section} onValueChange={v => setDraft(d => ({ ...d, section: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Section (opt.)" /></SelectTrigger>
            <SelectContent>
              {SECTION_OPTIONS.map(o => <SelectItem key={o} value={o}>Section {o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {(draft.course && draft.semester) && (
        <button type="button" onClick={addMapping}
          className="w-full h-8 text-xs border border-dashed border-primary/40 text-primary rounded-md hover:bg-primary/5 transition-colors">
          + Save Mapping
        </button>
      )}
    </div>
  );
}