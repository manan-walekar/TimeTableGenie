import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calendar, BookOpen, Users, DoorOpen, AlertTriangle, 
  CheckCircle, Clock, Zap, Search, Plus, ArrowRight, 
  TrendingUp, GraduationCap, LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-1:00 (Lunch)', '1:00-2:00', '2:00-3:00', '3:00-4:00'];

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500'];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const [facultySearch, setFacultySearch] = useState('');

  const { data: faculty = [] } = useQuery({ queryKey: ['faculty'], queryFn: () => base44.entities.Faculty.list() });
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: () => base44.entities.Room.list() });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => base44.entities.Subject.list() });
  const { data: timetables = [] } = useQuery({ queryKey: ['timetables'], queryFn: () => base44.entities.Timetable.list('-created_date') });

  const today = DAYS[new Date().getDay()];
  const latestTimetable = timetables[0];
  const todaySchedule = (latestTimetable?.schedule?.filter(s => s.day === today) || []).sort((a, b) => a.slot - b.slot);
  const conflicts = latestTimetable?.conflicts || [];
  const totalScheduled = latestTimetable?.schedule?.length || 0;

  const filteredFaculty = faculty.filter(f => f.name?.toLowerCase().includes(facultySearch.toLowerCase()));

  const stats = [
    { label: 'Total Classes', value: totalScheduled, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Courses', value: timetables.length, icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
    { label: 'Subjects', value: subjects.length, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Faculty', value: faculty.length, icon: Users, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: 'Rooms', value: rooms.length, icon: DoorOpen, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  ];

  const quickActions = [
    { label: 'Add New Class', desc: 'Schedule a new session', icon: Calendar, color: 'bg-blue-100 text-blue-600', to: '/timetable' },
    { label: 'Manage Subjects', desc: 'Add or edit subjects', icon: BookOpen, color: 'bg-purple-100 text-purple-600', to: '/subjects' },
    { label: 'Faculty Directory', desc: 'View all faculty members', icon: Users, color: 'bg-green-100 text-green-600', to: '/faculty' },
    { label: 'Room Availability', desc: 'Check room schedules', icon: DoorOpen, color: 'bg-orange-100 text-orange-600', to: '/rooms' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back — here's what's happening today</p>
        </div>
        <Button asChild>
          <Link to="/timetable"><Plus className="w-4 h-4 mr-2" />Quick Add</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Schedule Conflicts Detected</p>
              <p className="text-xs text-red-600 dark:text-red-400/80">{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found in the current timetable</p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-red-500 hover:bg-red-600 text-white">
            <Link to="/timetable">Review</Link>
          </Button>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Today's Schedule</span>
            </div>
            <Link to="/views" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {todaySchedule.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No classes today</p>
              </div>
            ) : (
              todaySchedule.slice(0, 6).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors">
                  <div className="w-1.5 h-10 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{entry.subject_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.faculty_name} · Room {entry.room_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Slot {entry.slot + 1}</p>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto mt-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Bottom stats */}
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <div className="px-5 py-3">
              <p className="text-lg font-bold text-foreground">{totalScheduled}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <div className="px-5 py-3">
              <p className="text-lg font-bold text-red-500">{conflicts.length}</p>
              <p className="text-xs text-muted-foreground">Conflicts</p>
            </div>
            <div className="px-5 py-3">
              <p className="text-lg font-bold text-foreground">{faculty.length}</p>
              <p className="text-xs text-muted-foreground">Faculty Active</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-semibold text-sm">Quick Actions</p>
            </div>
            <div className="p-3 space-y-1">
              {quickActions.map((a, i) => (
                <Link key={i} to={a.to} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center shrink-0`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Active Faculty */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-semibold text-sm">Active Faculty</p>
            </div>
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search faculty name..."
                  value={facultySearch}
                  onChange={e => setFacultySearch(e.target.value)}
                  className="pl-8 h-8 text-sm bg-muted border-0"
                />
              </div>
              <div className="space-y-2">
                {filteredFaculty.slice(0, 4).map((f, i) => {
                  const load = Math.floor(Math.random() * 8) + 12; // 12-20
                  const pct = Math.round((load / 20) * 100);
                  return (
                    <div key={f.id} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center shrink-0`}>
                        <span className="text-[10px] font-bold text-white">{getInitials(f.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{f.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground whitespace-nowrap">{load}h working</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredFaculty.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No faculty found</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}