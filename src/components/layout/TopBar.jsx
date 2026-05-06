import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Menu, LogIn, LogOut, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

export default function TopBar({ title, onMobileMenuToggle, user }) {
  const { logout } = useAuth();
  const [showBell, setShowBell] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { data: timetables = [] } = useQuery({
    queryKey: ['timetables'],
    queryFn: () => base44.entities.Timetable.list(),
  });

  const allConflicts = timetables.flatMap(t =>
    (t.conflicts || []).map(c => ({ timetable: t.name, message: c }))
  );

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuToggle} className="md:hidden p-1.5 rounded hover:bg-accent">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setShowBell(v => !v)}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {allConflicts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                {allConflicts.length > 9 ? '9+' : allConflicts.length}
              </span>
            )}
          </button>
          {showBell && (
            <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-sm font-semibold">Conflicts</p>
                <p className="text-xs text-muted-foreground">{allConflicts.length} issue(s) across saved timetables</p>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-border">
                {allConflicts.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-4 py-3">No conflicts found.</p>
                ) : allConflicts.map((c, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <p className="text-xs font-medium text-destructive">{c.timetable}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-primary hover:opacity-90 transition-opacity"
            )}
          >
            {initials}
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-10 w-44 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden py-1">
              {user ? (
                <>
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold truncate">{user.full_name || 'User'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Login
                  </button>
                  <button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}