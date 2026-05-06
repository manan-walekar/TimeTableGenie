import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, MoreVertical, Mail, Phone, Upload, X } from 'lucide-react';
import ImportDataDialog from '@/components/shared/ImportDataDialog';
import FacultyScheduleDialog from '@/components/faculty/FacultyScheduleDialog';
import FacultyFormDialog from '@/components/faculty/FacultyFormDialog';
import FacultyDetailsDialog from '@/components/faculty/FacultyDetailsDialog';
import { useNotification } from '@/components/shared/NotificationToast';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const COURSE_OPTIONS = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'MBA'];
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// Course-based color mapping for consistent grouping
const COURSE_COLORS = {
  'B.Tech': 'bg-blue-500',
  'M.Tech': 'bg-purple-500',
  'BCA': 'bg-green-500',
  'MCA': 'bg-orange-500',
  'B.Sc': 'bg-red-500',
  'MBA': 'bg-indigo-500',
  'default': 'bg-gray-500'
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// Get the primary course for a faculty member from their academic mappings
function getFacultyCourse(faculty) {
  if (faculty.academic_mappings && faculty.academic_mappings.length > 0) {
    return faculty.academic_mappings[0].course;
  }
  return 'default';
}

// Get color based on faculty's course
function getCourseColor(faculty) {
  const course = getFacultyCourse(faculty);
  return COURSE_COLORS[course] || COURSE_COLORS['default'];
}

const LOAD_COLORS = ['bg-yellow-400', 'bg-orange-400', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];

export default function Faculty() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');
  const [scheduleFor, setScheduleFor] = useState(null);
  const [scheduleColorIdx, setScheduleColorIdx] = useState(0);
  const [detailsFor, setDetailsFor] = useState(null);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const { data: faculty = [] } = useQuery({ queryKey: ['faculty'], queryFn: () => base44.entities.Faculty.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => base44.entities.Subject.list() });
  const { data: timetables = [] } = useQuery({ queryKey: ['timetables'], queryFn: () => base44.entities.Timetable.list() });

  // Compute real workload from timetables
  const getFacultyLoad = (facultyName) => {
    let assigned = 0;
    timetables.forEach(tt => {
      (tt.schedule || []).forEach(slot => {
        if (slot.faculty_name === facultyName) assigned++;
      });
    });
    return assigned;
  };

  const createMutation = useMutation({
    mutationFn: (data) => {
      console.log('Mutation: Starting faculty creation with data:', data);
      return base44.entities.Faculty.create(data);
    },
    onSuccess: (result) => {
      console.log('Mutation: Faculty creation succeeded:', result);
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      notify('Success', 'Faculty member added');
    },
    onError: (error) => {
      console.error('Mutation: Faculty creation failed:', error);
      notify('Error', 'Failed to add faculty member');
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Faculty.delete(id),
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['faculty'] });notify('Deleted', 'Faculty member removed');}
  });

  const departments = [...new Set(faculty.map((f) => f.department).filter(Boolean))];

  // Sort faculty by course for grouping
  const sortedFaculty = [...faculty].sort((a, b) => {
    const courseA = getFacultyCourse(a);
    const courseB = getFacultyCourse(b);
    const courseOrder = COURSE_OPTIONS.indexOf(courseA) - COURSE_OPTIONS.indexOf(courseB);
    if (courseOrder !== 0) return courseOrder;
    // If same course, sort by name
    return a.name?.localeCompare(b.name) || 0;
  });

  // Filter faculty based on search and academic context
  const filtered = sortedFaculty.filter((f) => {
    // Search filter
    const matchesSearch = 
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.department?.toLowerCase().includes(search.toLowerCase());
    
    // Academic context filter
    let matchesContext = true;
    if (filterCourse || filterYear || filterSemester) {
      const mappings = f.academic_mappings || [];
      matchesContext = mappings.some(m => {
        const matchCourse = !filterCourse || m.course === filterCourse;
        const matchYear = !filterYear || m.year === filterYear;
        const matchSemester = !filterSemester || m.semester === filterSemester;
        return matchCourse && matchYear && matchSemester;
      });
    }
    
    return matchesSearch && matchesContext;
  });

  const clearFilters = () => {
    setFilterCourse('');
    setFilterYear('');
    setFilterSemester('');
  };

  const hasActiveFilters = filterCourse || filterYear || filterSemester;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Faculty Directory</h1>
            <p className="text-sm text-muted-foreground">
              Manage {faculty.length} academic staff members and their active teaching loads
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="w-4 h-4 mr-2" />Import
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Faculty
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search faculty, departments, or subjects..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_OPTIONS.map(course => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTER_OPTIONS.map(sem => (
                <SelectItem key={sem} value={sem}>Sem {sem}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
              <X className="w-3.5 h-3.5 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Faculty Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((f, i) => {
            const load = 12 + i % 9;
            const loadPct = Math.round(load / 20 * 100);
            const assignedSubjects = subjects.slice(i % Math.max(subjects.length, 1), i % Math.max(subjects.length, 1) + 2);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getCourseColor(f)} flex items-center justify-center shrink-0`}>
                      <span className="text-sm font-bold text-white">{getInitials(f.name)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{f.name}</p>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      </div>
                      <p className="text-xs text-muted-foreground">{f.department}</p>
                      {getFacultyCourse(f) !== 'default' && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{getFacultyCourse(f)}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground p-0.5">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailsFor(f)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {setScheduleFor(f);setScheduleColorIdx(i);}}>
                        View Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(f.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Teaching Load — dynamic */}
                <div className="mb-3">
                  {(() => {
                    const assigned = getFacultyLoad(f.name);
                    const total = f.total_hours_per_week || 20;
                    const pct = Math.min(Math.round((assigned / total) * 100), 100);
                    const isBusy = assigned >= total;
                    const barColor = isBusy ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-green-500';
                    return (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Weekly Teaching Load</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{assigned} / {total} HRS</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isBusy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {isBusy ? '🔴 Busy' : '🟢 Free'}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% occupied · {Math.max(total - assigned, 0)} hrs remaining</p>
                      </>
                    );
                  })()}
                </div>

                {/* Assigned Subjects */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Assigned Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedSubjects.length > 0 ? assignedSubjects.map((s) =>
                    <span key={s.id} className="text-xs bg-muted px-2 py-0.5 rounded-md border border-border">{s.name}</span>
                    ) : <span className="text-xs text-muted-foreground">None assigned</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    {f.email &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={`mailto:${f.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top"><p className="text-xs">{f.email}</p></TooltipContent>
                      </Tooltip>
                    }
                    {f.phone &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={`tel:${f.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="top"><p className="text-xs">{f.phone}</p></TooltipContent>
                      </Tooltip>
                    }
                  </div>
                  <button
                    onClick={() => {setScheduleFor(f);setScheduleColorIdx(i);}}
                    className="text-xs text-primary hover:underline font-medium">
                    
                    Full Schedule
                  </button>
                </div>
              </motion.div>);

          })}
        </div>

        {filtered.length === 0 &&
        <div className="py-16 text-center text-muted-foreground">
            <p>No faculty found</p>
          </div>
        }

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border pt-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Staff</p>
            <p className="text-2xl font-bold mt-1">{String(faculty.length).padStart(2, '0')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Avg. Weekly Load</p>
            <p className="text-2xl font-bold mt-1 text-primary">16 HRS</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Departments</p>
            <p className="text-2xl font-bold mt-1">{String(departments.length).padStart(2, '0')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Active</p>
            <p className="text-2xl font-bold mt-1">{String(faculty.length).padStart(2, '0')}</p>
          </div>
        </div>

        <FacultyFormDialog
          open={showForm}
          onOpenChange={setShowForm}
          onSubmit={(data) => createMutation.mutate(data)}
        />
        <ImportDataDialog
          open={showImport}
          onOpenChange={setShowImport}
          entityName="Faculty"
          onImport={async (records) => {
            await Promise.all(records.map(r => base44.entities.Faculty.create(r)));
            queryClient.invalidateQueries({ queryKey: ['faculty'] });
            notify('Imported', `${records.length} faculty member(s) added`);
          }}
        />
        <FacultyScheduleDialog
          open={!!scheduleFor}
          onOpenChange={(v) => !v && setScheduleFor(null)}
          faculty={scheduleFor}
          timetables={timetables}
          colorIndex={scheduleColorIdx} />
        <FacultyDetailsDialog
          open={!!detailsFor}
          onOpenChange={(v) => !v && setDetailsFor(null)}
          faculty={detailsFor}
          timetables={timetables} />
        
      </div>
    </TooltipProvider>);

}