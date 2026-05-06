import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, CalendarDays, Users, DoorOpen, BookOpen, Eye, Settings, ChevronLeft, Sparkles
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/timetable', label: 'Timetable', icon: CalendarDays },
  { path: '/faculty', label: 'Faculty', icon: Users },
  { path: '/rooms', label: 'Rooms', icon: DoorOpen },
  { path: '/subjects', label: 'Subjects', icon: BookOpen },
  { path: '/views', label: 'Saved Views', icon: Eye },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-all duration-300",
      collapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-sidebar-foreground tracking-wide">TIME TABLE</span>
            <span className="text-[10px] font-semibold text-primary tracking-widest">GENIE</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-lg text-sm font-medium transition-colors relative",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
              {active && collapsed && (
                <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}