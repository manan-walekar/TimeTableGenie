import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Zap, Users, Clock, Building, Settings2, Info, RotateCcw } from 'lucide-react';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SMART_DEFAULTS = {
  activeDayToggles: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false },
  slotsPerDay: 7,
  maxLecturesPerDay: 5,
  maxLabsPerDay: 1,
  maxFacultyHoursPerDay: 6,
  maxFacultyHoursPerWeek: 20,
  maxConsecutiveClasses: 3,
  breakAfterSlot: 3,
  roomPreference: '',
  subjectPriority: '',
  weeklyCreditsLimit: 15,
};

function TipLabel({ label, tip }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1.5 mb-1">
        <Label className="text-xs font-medium">{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">{tip}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function NumberField({ label, tip, value, onChange, min = 1, max = 20 }) {
  return (
    <div>
      <TipLabel label={label} tip={tip} />
      <Input type="number" min={min} max={max} value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="h-8 text-sm" />
    </div>
  );
}

export default function ConstraintsModal({ open, onOpenChange, faculty, rooms, subjects, onGenerate }) {
  const [c, setC] = useState({ ...SMART_DEFAULTS });
  const set = (k, v) => setC(prev => ({ ...prev, [k]: v }));

  const toggleDay = (day) => {
    setC(prev => ({
      ...prev,
      activeDayToggles: { ...prev.activeDayToggles, [day]: !prev.activeDayToggles[day] }
    }));
  };

  const activeDayCount = Object.values(c.activeDayToggles).filter(Boolean).length;

  const handleReset = () => setC({ ...SMART_DEFAULTS });

  const handleGenerate = () => {
    if (activeDayCount === 0) return;
    onGenerate({ ...c, workingDays: activeDayCount });
    onOpenChange(false);
  };

  // Validation checks
  const warnings = [];
  if (activeDayCount < 3) warnings.push('Less than 3 working days may cause allocation failures.');
  if (c.slotsPerDay < 5) warnings.push('Less than 5 slots/day limits scheduling flexibility.');
  const totalCapacity = activeDayCount * c.maxLecturesPerDay;
  const totalNeeded = subjects.reduce((sum, s) => sum + (Number(s.credits) || 3), 0);
  if (totalCapacity < totalNeeded) warnings.push(`Total capacity (${totalCapacity} slots) < credit demand (${totalNeeded}). Some subjects may not fit.`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Advanced Generation Constraints
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Configure scheduling rules before generating. Smart defaults are pre-filled.</p>
        </DialogHeader>

        <Tabs defaultValue="time" className="mt-1">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="time" className="text-xs gap-1"><Clock className="w-3 h-3" />Time</TabsTrigger>
            <TabsTrigger value="faculty" className="text-xs gap-1"><Users className="w-3 h-3" />Faculty</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs gap-1"><Building className="w-3 h-3" />Rooms</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs gap-1"><Settings2 className="w-3 h-3" />Advanced</TabsTrigger>
          </TabsList>

          {/* ─── TIME ─── */}
          <TabsContent value="time" className="space-y-4 mt-3">
            <div>
              <TipLabel label="Working Days" tip="Toggle which days are active for scheduling." />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ALL_DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                      c.activeDayToggles[d]
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{activeDayCount} day{activeDayCount !== 1 ? 's' : ''} active</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Slots / Day" tip="Total lecture slots per day (excluding lunch)." value={c.slotsPerDay} onChange={v => set('slotsPerDay', v)} min={4} max={9} />
              <NumberField label="Max Lectures / Day" tip="Maximum theory lectures per day." value={c.maxLecturesPerDay} onChange={v => set('maxLecturesPerDay', v)} max={9} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Max Labs / Day" tip="Maximum lab sessions per day (each = 2 slots)." value={c.maxLabsPerDay} onChange={v => set('maxLabsPerDay', v)} min={0} max={3} />
              <NumberField label="Break After Slot" tip="Insert lunch break after this slot number." value={c.breakAfterSlot} onChange={v => set('breakAfterSlot', v)} min={2} max={6} />
            </div>
            <div>
              <TipLabel label="Weekly Credit Cap" tip="Total credit-points allowed across all subjects this week. 1 credit = 1 theory session, Lab = 2 credits." />
              <div className="flex items-center gap-3">
                <Input type="number" min={5} max={30} value={c.weeklyCreditsLimit}
                  onChange={e => set('weeklyCreditsLimit', Math.max(5, Math.min(30, Number(e.target.value))))}
                  className="h-8 text-sm w-24" />
                <span className="text-xs text-muted-foreground">credit-points / week (default: 15)</span>
              </div>
            </div>
          </TabsContent>

          {/* ─── FACULTY ─── */}
          <TabsContent value="faculty" className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Max Hours / Day" tip="Maximum teaching hours per faculty per day." value={c.maxFacultyHoursPerDay} onChange={v => set('maxFacultyHoursPerDay', v)} max={9} />
              <NumberField label="Max Hours / Week" tip="Total weekly teaching hour cap per faculty." value={c.maxFacultyHoursPerWeek} onChange={v => set('maxFacultyHoursPerWeek', v)} max={40} />
            </div>
            <NumberField label="Max Consecutive Classes" tip="Avoid fatigue: limit back-to-back lectures." value={c.maxConsecutiveClasses} onChange={v => set('maxConsecutiveClasses', v)} min={1} max={6} />

            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs font-medium mb-2">Faculty Overview</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {faculty.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No faculty added yet</p>
                ) : faculty.slice(0, 8).map(f => (
                  <div key={f.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate max-w-[60%]">{f.name}</span>
                    <span className="text-muted-foreground">{f.department || '—'}</span>
                  </div>
                ))}
                {faculty.length > 8 && <p className="text-[10px] text-muted-foreground">+{faculty.length - 8} more</p>}
              </div>
            </div>
          </TabsContent>

          {/* ─── ROOMS ─── */}
          <TabsContent value="rooms" className="space-y-4 mt-3">
            <div>
              <TipLabel label="Preferred Room" tip="Prioritize this room for theory lectures." />
              <Select value={c.roomPreference} onValueChange={v => set('roomPreference', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Any room" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any room</SelectItem>
                  {rooms.map(r => <SelectItem key={r.id} value={r.name}>{r.name} ({r.type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <TipLabel label="High Priority Subject" tip="This subject gets scheduled first for best slots." />
              <Select value={c.subjectPriority} onValueChange={v => set('subjectPriority', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="None (equal priority)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (equal priority)</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.code}>{s.code} — {s.name} ({s.credits || '?'}cr)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs font-medium mb-2">Room Inventory</p>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                {rooms.length === 0 ? (
                  <p className="text-xs text-muted-foreground col-span-2">No rooms added yet</p>
                ) : rooms.slice(0, 10).map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.type === 'Lab' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <span className="truncate">{r.name}</span>
                    <span className="text-muted-foreground ml-auto text-[10px]">{r.type}</span>
                  </div>
                ))}
                {rooms.length > 10 && <p className="text-[10px] text-muted-foreground col-span-2">+{rooms.length - 10} more</p>}
              </div>
            </div>
          </TabsContent>

          {/* ─── ADVANCED ─── */}
          <TabsContent value="advanced" className="space-y-4 mt-3">
            <div className="border border-border rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-primary">Credit-Based Engine (Active)</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• 2 credits → 1 lab block (2 consecutive slots)</p>
                <p>• 3 credits → 3 theory lectures / week</p>
                <p>• 4 credits → 4 lectures OR 3 lectures + 1 lab</p>
              </div>
              <p className="text-[10px] text-muted-foreground border-t border-border pt-2">Generation will fail if credits cannot be fully assigned.</p>
            </div>

            <div className="border border-border rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-primary">Smart Distribution Rules</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Max 1 theory lecture per subject per day</p>
                <p>• Labs always occupy 2 consecutive slots</p>
                <p>• Min 1-day gap between same subject</p>
                <p>• Compact scheduling (minimize gaps)</p>
                <p>• Labs assigned before theory for best slots</p>
              </div>
            </div>

            <div className="border border-border rounded-lg p-3">
              <p className="text-xs font-semibold mb-2">Subject Demand Summary</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {subjects.map(s => {
                  const cr = Number(s.credits) || 3;
                  const type = (s.type || 'Theory');
                  const isLab = type === 'Lab' || cr === 2;
                  return (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[40%]">{s.code}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isLab ? 'bg-green-100 text-green-700' : type === 'Elective' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>{type}</span>
                      <span className="text-muted-foreground">{cr} cr</span>
                      <span className="text-muted-foreground">
                        {isLab ? '1 lab block' : `${cr} lec/wk`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border mt-2 pt-2 flex justify-between text-xs font-medium">
                <span>Total demand:</span>
                <span className="text-primary">{subjects.reduce((s, sub) => s + (Number(sub.credits) || 3), 0)} credit-hours</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700">⚠ {w}</p>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-between pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />Reset Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleGenerate} disabled={activeDayCount === 0} className="gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />Generate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}