import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Calendar, Clock, User, GraduationCap, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500'];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function FacultyDetailsDialog({ open, onOpenChange, faculty, timetables = [] }) {
  if (!faculty) return null;

  const assigned = timetables.reduce((count, tt) => {
    return count + (tt.schedule || []).filter(slot => slot.faculty_name === faculty.name).length;
  }, 0);

  const total = faculty.total_hours_per_week || 20;
  const pct = Math.min(Math.round((assigned / total) * 100), 100);
  const isBusy = assigned >= total;

  const colorIndex = faculty.id ? faculty.id.charCodeAt(0) % AVATAR_COLORS.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Faculty Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-full ${AVATAR_COLORS[colorIndex]} flex items-center justify-center shrink-0`}>
              <span className="text-xl font-bold text-white">{getInitials(faculty.name)}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{faculty.name}</h3>
              {faculty.designation && (
                <p className="text-sm text-muted-foreground mt-0.5">{faculty.designation}</p>
              )}
              {faculty.department && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{faculty.department}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faculty.email && (
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a href={`mailto:${faculty.email}`} className="text-sm font-medium hover:text-primary truncate block">
                    {faculty.email}
                  </a>
                </div>
              </div>
            )}
            {faculty.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a href={`tel:${faculty.phone}`} className="text-sm font-medium hover:text-primary truncate block">
                    {faculty.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Teaching Load */}
          <div className="p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Weekly Teaching Load</span>
              </div>
              <Badge variant={isBusy ? "destructive" : "default"} className="text-xs">
                {isBusy ? 'Busy' : 'Available'}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{assigned} <span className="text-sm font-normal text-muted-foreground">/ {total} hrs</span></span>
              <span className="text-sm text-muted-foreground">{pct}% occupied</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${isBusy ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-green-500'}`} 
                style={{ width: `${pct}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{Math.max(total - assigned, 0)} hours remaining this week</p>
          </div>

          {/* Academic Mappings */}
          {faculty.academic_mappings && faculty.academic_mappings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Academic Assignments</span>
              </div>
              <div className="space-y-2">
                {faculty.academic_mappings.map((mapping, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
                    <Badge variant="outline" className="text-xs">{mapping.course}</Badge>
                    <span className="text-xs text-muted-foreground">Year {mapping.year}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">Sem {mapping.semester}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Slots */}
          {faculty.available_slots && faculty.available_slots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Available Time Slots</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {faculty.available_slots.map((slot, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {slot}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {faculty.email && (
              <Button onClick={() => window.location.href = `mailto:${faculty.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
