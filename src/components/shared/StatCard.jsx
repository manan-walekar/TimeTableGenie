import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    destructive: 'bg-destructive/10 text-destructive',
    chart3: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  };

  return (
    <Card className="p-5 flex items-center gap-4 hover:shadow-lg transition-shadow duration-300">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}