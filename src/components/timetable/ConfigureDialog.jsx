import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const defaultConfig = {
  // Institution
  instituteName: 'SAGE University, Indore',
  departmentName: 'Computer Science & Engineering',
  session: 'Jan-June 2026',
  // Class Details
  program: 'B.Tech',
  section: 'A',
  semester: 'IV',
  roomNo: '101',
  shift: 'FIRST',
  date: new Date().toLocaleDateString('en-GB'),
  // Signature
  preparedBy: '',
  checkedBy: '',
  approvedBy: '',
  // Constraints
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

export default function ConfigureDialog({ open, onOpenChange, config, onSave }) {
  const [local, setLocal] = useState(config || defaultConfig);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    onSave(local);
    onOpenChange(false);
  };

  const Field = ({ label, k, type = 'text', placeholder = '' }) => (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input type={type} value={local[k] || ''} onChange={e => set(k, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder} className="h-8 text-sm" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Timetable</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="institution">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="institution" className="text-xs">Institution</TabsTrigger>
            <TabsTrigger value="class" className="text-xs">Class Details</TabsTrigger>
            <TabsTrigger value="signature" className="text-xs">Signature</TabsTrigger>
          </TabsList>

          <TabsContent value="institution" className="space-y-4 pt-4">
            <div className="font-semibold text-sm text-primary mb-3">Institution Information</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Institution Name" k="instituteName" placeholder="SAGE University, Indore" />
              <Field label="Department Name" k="departmentName" placeholder="Computer Science & Engineering" />
              <Field label="Session" k="session" placeholder="Jan-June 2026" />
            </div>
          </TabsContent>

          <TabsContent value="class" className="space-y-4 pt-4">
            <div className="font-semibold text-sm text-primary mb-3">Class Details</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Program" k="program" placeholder="B.Tech" />
              <Field label="Semester" k="semester" placeholder="IV" />
              <Field label="Section" k="section" placeholder="A" />
              <Field label="Room No." k="roomNo" placeholder="101" />
              <Field label="Shift" k="shift" placeholder="FIRST" />
              <Field label="Date" k="date" placeholder="DD/MM/YYYY" />
            </div>
          </TabsContent>

          <TabsContent value="signature" className="space-y-4 pt-4">
            <div className="font-semibold text-sm text-primary mb-3">Signature Section</div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Prepared By" k="preparedBy" placeholder="Name of preparer" />
              <Field label="Checked By" k="checkedBy" placeholder="Name of checker" />
              <Field label="Approved By" k="approvedBy" placeholder="Name of approver (HoD)" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}