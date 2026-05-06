import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AcademicContextSelector from '@/components/shared/AcademicContextSelector';

const SUBJECT_TYPES = ['Theory', 'Lab', 'Elective'];

const DEFAULT = {
  name: '',
  code: '',
  department: '',
  credits: 3,
  hours_per_week: 4,
  type: 'Theory',
  academic_mappings: []
};

export default function SubjectFormDialog({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(DEFAULT);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.code) return;
    onSubmit({
      ...form,
      credits: Number(form.credits) || 3,
      hours_per_week: Number(form.hours_per_week) || 4
    });
    setForm(DEFAULT);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setForm(DEFAULT); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Subject</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-sm font-medium mb-1.5 block">Subject Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Data Structures" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Subject Code *</Label>
              <Input value={form.code} onChange={e => set('code', e.target.value)} placeholder="CS201" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Department</Label>
              <Input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Computer Science" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SUBJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Credits</Label>
              <Input type="number" value={form.credits} onChange={e => set('credits', e.target.value)} placeholder="3" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Hours/Week</Label>
              <Input type="number" value={form.hours_per_week} onChange={e => set('hours_per_week', e.target.value)} placeholder="4" />
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 bg-muted/20">
            <AcademicContextSelector
              value={form.academic_mappings}
              onChange={v => set('academic_mappings', v)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.code}>
              Add Subject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
