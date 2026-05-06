import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COURSE_OPTIONS = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'MBA'];
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export default function FacultySelectionDialog({ open, onOpenChange, faculty, selectedFaculty, onSelectionChange }) {
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  // Filter faculty based on search and filters
  const filteredFaculty = useMemo(() => {
    return faculty.filter(f => {
      const matchesSearch = f.name?.toLowerCase().includes(search.toLowerCase()) ||
                           f.department?.toLowerCase().includes(search.toLowerCase());
      
      // For now, we'll filter by department as a proxy for course/year/semester
      // In a real app, faculty would have course/year/semester assignments
      const matchesCourse = !filterCourse || f.department?.toLowerCase().includes(filterCourse.toLowerCase());
      const matchesYear = !filterYear || f.department?.toLowerCase().includes(filterYear.toLowerCase());
      const matchesSemester = !filterSemester || f.department?.toLowerCase().includes(filterSemester.toLowerCase());
      
      return matchesSearch && matchesCourse && matchesYear && matchesSemester;
    });
  }, [faculty, search, filterCourse, filterYear, filterSemester]);

  const allSelected = filteredFaculty.length > 0 && filteredFaculty.every(f => selectedFaculty.includes(f.id));
  const someSelected = filteredFaculty.some(f => selectedFaculty.includes(f.id));

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all filtered
      const newSelection = selectedFaculty.filter(id => !filteredFaculty.find(f => f.id === id));
      onSelectionChange(newSelection);
    } else {
      // Select all filtered
      const newSelection = [...new Set([...selectedFaculty, ...filteredFaculty.map(f => f.id)])];
      onSelectionChange(newSelection);
    }
  };

  const handleToggleFaculty = (facultyId) => {
    if (selectedFaculty.includes(facultyId)) {
      onSelectionChange(selectedFaculty.filter(id => id !== facultyId));
    } else {
      onSelectionChange([...selectedFaculty, facultyId]);
    }
  };

  const selectedCount = filteredFaculty.filter(f => selectedFaculty.includes(f.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Faculty for Timetable</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-3 pb-3 border-b border-border">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="h-9 px-3 text-sm border border-border rounded-md bg-background"
            >
              <option value="">All Courses</option>
              {COURSE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="h-9 px-3 text-sm border border-border rounded-md bg-background"
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="h-9 px-3 text-sm border border-border rounded-md bg-background"
            >
              <option value="">All Semesters</option>
              {SEMESTER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>Semester {opt}</option>
              ))}
            </select>
          </div>

          {/* Select All / Deselect All */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedCount} / {filteredFaculty.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredFaculty.length === 0}
              >
                {allSelected ? (
                  <>
                    <X className="w-3.5 h-3.5 mr-1.5" />Deselect All
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />Select All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Faculty List */}
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          <div className="space-y-1">
            {filteredFaculty.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No faculty found matching your filters
              </div>
            ) : (
              filteredFaculty.map((f) => {
                const isSelected = selectedFaculty.includes(f.id);
                const totalHours = f.total_hours_per_week || 20;
                const isFree = totalHours > 0; // Simplified - in real app, calculate from existing timetables
                
                return (
                  <div
                    key={f.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                      isSelected ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:bg-muted/50"
                    )}
                    onClick={() => handleToggleFaculty(f.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleFaculty(f.id)}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{f.name}</span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          isFree ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        )}>
                          {isFree ? "Free" : "Busy"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{f.department}</span>
                        <span>•</span>
                        <span>{totalHours}h/wk</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Apply Selection ({selectedCount} faculty)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
