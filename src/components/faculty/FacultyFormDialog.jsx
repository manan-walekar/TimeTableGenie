import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AcademicContextSelector from '@/components/shared/AcademicContextSelector';

const DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

const DEFAULT = {
  name: '', department: '', email: '', phone: '',
  designation: '', total_hours_per_week: 20, academic_mappings: []
};

export default function FacultyFormDialog({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState(DEFAULT);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.department) {
      console.log('Validation failed:', { name: form.name, department: form.department });
      return;
    }
    const dataToSubmit = { ...form, total_hours_per_week: Number(form.total_hours_per_week) || 20 };
    console.log('Submitting faculty data:', dataToSubmit);
    onSubmit(dataToSubmit);
    setForm(DEFAULT);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setForm(DEFAULT); } onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Faculty Member</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new faculty member to the directory.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-sm font-medium mb-1.5 block">Full Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. John Smith" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Department *</Label>
              <Input value={form.department} onChange={e => set('department', e.target.value)} placeholder="Computer Science" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Designation</Label>
              <Select value={form.designation} onValueChange={v => set('designation', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Email</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@university.edu" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Phone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 890" />
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-medium mb-1.5 block">Available Hours / Week</Label>
              <Input type="number" value={form.total_hours_per_week} onChange={e => set('total_hours_per_week', e.target.value)}
                placeholder="20" className="w-28" />
              <p className="text-xs text-muted-foreground mt-1">Default: 20 hrs/week</p>
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
            <Button onClick={handleSubmit} disabled={!form.name || !form.department}>
              Add Faculty
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}