import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, GraduationCap, BookOpen, Upload, FlaskConical, Lightbulb, Info } from 'lucide-react';
import SubjectDetailDialog from '@/components/subjects/SubjectDetailDialog';
import SubjectFormDialog from '@/components/subjects/SubjectFormDialog';
import ImportDataDialog from '@/components/shared/ImportDataDialog';
import { useNotification } from '@/components/shared/NotificationToast';
import { motion } from 'framer-motion';

const TYPE_STYLES = {
  Theory:   { gradient: 'from-blue-500 to-blue-700',   badge: 'bg-blue-100 text-blue-700',   icon: BookOpen,    label: 'Theory' },
  Lab:      { gradient: 'from-green-500 to-teal-600',  badge: 'bg-green-100 text-green-700',  icon: FlaskConical, label: 'Lab' },
  Elective: { gradient: 'from-purple-500 to-purple-700', badge: 'bg-purple-100 text-purple-700', icon: Lightbulb, label: 'Elective' },
};
const FALLBACK_STYLE = { gradient: 'from-gray-500 to-gray-700', badge: 'bg-gray-100 text-gray-700', icon: GraduationCap };

const formFields = [
{ key: 'name', label: 'Subject Name', required: true, placeholder: 'Data Structures' },
{ key: 'code', label: 'Subject Code', required: true, placeholder: 'CS201' },
{ key: 'department', label: 'Department', placeholder: 'Computer Science' },
{ key: 'credits', label: 'Credits', type: 'number', placeholder: '3' },
{ key: 'hours_per_week', label: 'Hours Per Week', type: 'number', placeholder: '4' },
{ key: 'type', label: 'Type', type: 'select', options: ['Theory', 'Lab', 'Elective'] }];


export default function Subjects() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [detailSubject, setDetailSubject] = useState(null);
  const [activeDept, setActiveDept] = useState('All Courses');
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list()
  });
  const { data: timetables = [] } = useQuery({ queryKey: ['timetables'], queryFn: () => base44.entities.Timetable.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Subject.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Subject.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] })
  });

  // Compute how many times a subject has been assigned in timetables
  const getSubjectUsedHours = (code) => {
    let count = 0;
    timetables.forEach(tt => {
      (tt.schedule || []).forEach(slot => {
        if (slot.subject_code === code) count++;
      });
    });
    return count;
  };

  const departments = [...new Set(subjects.map((s) => s.department).filter(Boolean))];
  const deptFilters = ['All Courses', ...departments];

  const filtered = subjects.filter((s) => {
    const matchDept = activeDept === 'All Courses' || s.department === activeDept;
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subject Catalog</h1>
          <p className="text-sm text-muted-foreground">Explore and manage subjects across <span className="text-primary">all departments</span></p>
        </div>
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by subject name or code (e.g. CS201)" value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          

          
          

          
          

          
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />Import
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Subject
          </Button>
        </div>
      </div>

      {/* Department Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {deptFilters.map((d) =>
        <button
          key={d}
          onClick={() => setActiveDept(d)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
          activeDept === d ?
          'bg-primary text-primary-foreground border-primary' :
          'bg-card border-border text-muted-foreground hover:text-foreground'}`
          }>
          
            {d}
          </button>
        )}
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((subject, i) => {
          const style = TYPE_STYLES[subject.type] || FALLBACK_STYLE;
          const Icon = style.icon;
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Banner */}
              <div className={`bg-gradient-to-br ${style.gradient} h-28 flex items-center justify-center relative`}>
                <span className="absolute top-3 left-3 text-white/90 text-xs font-bold bg-black/20 px-2 py-0.5 rounded">{subject.code}</span>
                {subject.type && <span className="absolute top-3 right-3 text-white text-xs font-bold bg-black/20 px-2 py-0.5 rounded">{subject.type}</span>}
                <Icon className="w-10 h-10 text-white/80" />
              </div>
              {/* Content */}
              <div className="p-4">
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${style.badge}`}>
                  {subject.type || 'General'}
                </span>
                <p className="font-semibold text-sm mt-2">{subject.name}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">
                  {subject.department || 'N/A'} · {subject.credits || 3} credits
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" />{subject.credits || '—'} Credits
                  </div>
                  <span className="text-xs text-muted-foreground">{subject.hours_per_week || '—'} hrs/wk</span>
                </div>
                {/* Credit usage bar */}
                {(() => {
                  const credits = subject.credits || 0;
                  const used = getSubjectUsedHours(subject.code);
                  const pct = credits > 0 ? Math.min(Math.round((used / credits) * 100), 100) : 0;
                  const over = used > credits;
                  return credits > 0 ? (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Credit usage</span>
                        <span className={over ? 'text-red-500 font-bold' : ''}>{used}/{credits} {over ? '⚠ Over!' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : null;
                })()}
                {(subject.academic_mappings || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {subject.academic_mappings.slice(0,2).map((m, mi) => (
                      <span key={mi} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {[m.course, m.semester && `Sem ${m.semester}`, m.section && `Sec ${m.section}`].filter(Boolean).join(' · ')}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setDetailSubject(subject)}
                    className="flex-1 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Details
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(subject.id)}
                    className="flex-1 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 &&
      <div className="py-16 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No subjects found</p>
        </div>
      }

      <p className="text-sm text-muted-foreground">Showing {filtered.length} of {subjects.length} subjects</p>

      <SubjectFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => createMutation.mutate(data)}
      />
      <ImportDataDialog
        open={showImport}
        onOpenChange={setShowImport}
        entityName="Subjects"
        onImport={async (records) => {
          await Promise.all(records.map(r => base44.entities.Subject.create(r)));
          queryClient.invalidateQueries({ queryKey: ['subjects'] });
          notify('Imported', `${records.length} subject(s) added`);
        }}
      />
      <SubjectDetailDialog
        subject={detailSubject}
        open={!!detailSubject}
        onOpenChange={(v) => !v && setDetailSubject(null)}
      />
    </div>
  );
}