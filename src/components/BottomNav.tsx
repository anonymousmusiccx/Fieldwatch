import React from 'react';
import {
  Compass,
  Crosshair,
  Sliders,
  Shield,
  FileText,
  Settings,
  Bookmark,
} from 'lucide-react';

export type AppRoute =
  | 'LIVE'
  | 'HUNT'
  | 'FILTERS'
  | 'FLEETS'
  | 'REPORTS'
  | 'SETTINGS'
  | 'DETAIL'
  | 'BOOKMARKS';

interface BottomNavProps {
  currentRoute: AppRoute;
  onChangeRoute: (route: AppRoute) => void;
  nightMode?: boolean;
  activeTargetKey?: string | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onChangeRoute,
  nightMode = false,
  activeTargetKey = null,
}) => {
  const navItems: { route: AppRoute; label: string; icon: React.FC<{ className?: string }> }[] = [
    { route: 'LIVE', label: 'RADAR', icon: Compass },
    { route: 'HUNT', label: 'HUNT', icon: Crosshair },
    { route: 'FILTERS', label: 'FILTERS', icon: Sliders },
    { route: 'FLEETS', label: 'FLEETS', icon: Shield },
    { route: 'REPORTS', label: 'DEBRIEF', icon: FileText },
    { route: 'SETTINGS', label: 'CONFIG', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080D14]/95 backdrop-blur border-t border-[#1E293B] px-2 py-1.5 flex items-center justify-around font-mono text-[10px]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.route;
        return (
          <button
            key={item.route}
            onClick={() => onChangeRoute(item.route)}
            className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg transition-all relative ${
              isActive
                ? nightMode
                  ? 'text-rose-400 bg-rose-950/40 border border-rose-800/50'
                  : 'text-[#10E79D] bg-emerald-950/40 border border-emerald-800/50'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#0E1724]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-semibold tracking-wider">{item.label}</span>
            {item.route === 'HUNT' && activeTargetKey && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
