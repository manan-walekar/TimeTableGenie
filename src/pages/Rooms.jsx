import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Monitor, FlaskConical, Users, Presentation, Plus, Search, MoreVertical, MapPin, Upload } from 'lucide-react';
import FormDialog from '@/components/shared/FormDialog';
import ImportDataDialog from '@/components/shared/ImportDataDialog';
import { useNotification } from '@/components/shared/NotificationToast';
import { motion } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ROOM_GRADIENTS = {
  'Lecture Hall': 'from-blue-500 to-blue-700',
  'Lab': 'from-green-500 to-green-700',
  'Seminar Room': 'from-purple-500 to-purple-700',
  'Auditorium': 'from-orange-500 to-orange-700',
};
const ROOM_BADGE_COLORS = {
  'Lecture Hall': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'Lab': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  'Seminar Room': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  'Auditorium': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
};
const ROOM_ICONS = {
  'Lecture Hall': Monitor,
  'Lab': FlaskConical,
  'Seminar Room': Presentation,
  'Auditorium': Users,
};

const FILTERS = ['All Rooms', 'Lecture Halls', 'Labs', 'Seminar Halls'];

const formFields = [
  { key: 'name', label: 'Room Name/Number', required: true, placeholder: 'Room 101' },
  { key: 'building', label: 'Building', placeholder: 'Main Building' },
  { key: 'capacity', label: 'Capacity', type: 'number', required: true, placeholder: '60' },
  { key: 'type', label: 'Room Type', type: 'select', options: ['Lecture Hall', 'Lab', 'Seminar Room', 'Auditorium'] },
];

export default function Rooms() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All Rooms');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Room.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rooms'] }); notify('Success', 'Room added'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Room.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rooms'] }); notify('Deleted', 'Room removed'); },
  });

  const lectureHalls = rooms.filter(r => r.type === 'Lecture Hall');
  const labs = rooms.filter(r => r.type === 'Lab');
  const seminarRooms = rooms.filter(r => r.type === 'Seminar Room');

  const filtered = rooms.filter(r => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) || r.building?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'All Rooms') return true;
    if (activeFilter === 'Lecture Halls') return r.type === 'Lecture Hall';
    if (activeFilter === 'Labs') return r.type === 'Lab';
    if (activeFilter === 'Seminar Halls') return r.type === 'Seminar Room';
    return true;
  });

  const statCards = [
    { label: 'Total Rooms', value: rooms.length, icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Lecture Halls', value: lectureHalls.length, icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Labs', value: labs.length, icon: FlaskConical, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
    { label: 'Seminar Halls', value: seminarRooms.length, icon: Presentation, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classroom Management</h1>
          <p className="text-sm text-muted-foreground">Overview of campus rooms and availability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />Import
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Add Room
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeFilter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f} {f !== 'All Rooms' && <span className="ml-1 opacity-70">
                {f === 'Lecture Halls' ? lectureHalls.length : f === 'Labs' ? labs.length : seminarRooms.length}
              </span>}
            </button>
          ))}
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((room, i) => {
          const Icon = ROOM_ICONS[room.type] || Monitor;
          const gradient = ROOM_GRADIENTS[room.type] || 'from-gray-500 to-gray-700';
          const badgeColor = ROOM_BADGE_COLORS[room.type] || 'bg-gray-100 text-gray-700';
          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Color banner */}
              <div className={`bg-gradient-to-br ${gradient} h-32 flex items-center justify-center`}>
                <Icon className="w-12 h-12 text-white/80" />
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm">{room.name}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground p-0.5">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(room.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${badgeColor}`}>{room.type}</span>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />{room.capacity} Seats
                  </div>
                  {room.building && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />{room.building}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-4 py-16 text-center text-muted-foreground">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No rooms found</p>
          </div>
        )}
      </div>

      <FormDialog open={showForm} onOpenChange={setShowForm} title="Add Room" fields={formFields}
        onSubmit={(data) => createMutation.mutate(data)} />
      <ImportDataDialog
        open={showImport}
        onOpenChange={setShowImport}
        entityName="Rooms"
        onImport={async (records) => {
          await Promise.all(records.map(r => base44.entities.Room.create(r)));
          queryClient.invalidateQueries({ queryKey: ['rooms'] });
          notify('Imported', `${records.length} room(s) added`);
        }}
      />
    </div>
  );
}