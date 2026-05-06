import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const pageTitles = {
  '/': 'Dashboard',
  '/timetable': 'Timetable Generator',
  '/faculty': 'Faculty Management',
  '/rooms': 'Room Management',
  '/subjects': 'Subject Management',
  '/views': 'Saved Timetables',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const title = pageTitles[location.pathname] || 'EduSchedule';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      
      {/* Sidebar - hidden on mobile unless open */}
      <div className={cn(
        "hidden md:block",
        mobileOpen && "!block"
      )}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "md:ml-[72px]" : "md:ml-[240px]"
      )}>
        <TopBar 
          title={title} 
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} 
          user={user}
        />
        <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}