import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FlaskConical, Lightbulb, GraduationCap } from 'lucide-react';

const TYPE_STYLES = {
  Theory: { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
  Lab: { icon: FlaskConical, color: 'text-green-600', bg: 'bg-green-100' },
  Elective: { icon: Lightbulb, color: 'text-purple-600', bg: 'bg-purple-100' },
};

export default function SubjectDetailDialog({ subject, open, onOpenChange }) {
  if (!subject) return null;

  const style = TYPE_STYLES[subject.type] || { icon: GraduationCap, color: 'text-gray-600', bg: 'bg-gray-100' };
  const Icon = style.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${style.bg}`}>
              <Icon className={`w-5 h-5 ${style.color}`} />
            </div>
            Subject Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-2xl font-bold">{subject.name}</h3>
            <p className="text-muted-foreground">{subject.code}</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge className={style.bg}>{subject.type}</Badge>
            {subject.department && <Badge variant="outline">{subject.department}</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">Credits</p>
              <p className="text-lg font-semibold">{subject.credits || 'N/A'}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">Hours/Week</p>
              <p className="text-lg font-semibold">{subject.hours_per_week || 'N/A'}</p>
            </div>
          </div>

          {subject.email && (
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{subject.email}</p>
            </div>
          )}

          {subject.academic_mappings && subject.academic_mappings.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Academic Mappings</p>
              <div className="flex flex-wrap gap-2">
                {subject.academic_mappings.map((mapping, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {mapping.course} - {mapping.year} - {mapping.semester}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
