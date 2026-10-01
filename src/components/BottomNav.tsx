import React from 'react';
import { Radio, Filter, Network, FileText, Settings, Pause, Play } from 'lucide-react';

interface BottomNavProps {
  currentRoute: string;
  onChangeRoute: (route: string) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  unclassifiedCount?: number;
  activeFilterCount?: number;
  nightMode?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onChangeRoute,
  isPaused,
  onTogglePause,
  activeFilterCount = 0,
  nightMode = false,
}) => {
  const tabs = [
    { id: 'LIVE', label: 'Live', icon: Radio },
    { id: 'FILTERS', label: 'Filters', icon: Filter, badge: activeFilterCount },
    { id: 'FLEETS', label: 'Signatures', icon: Network },
    { id: 'REPORTS', label: 'Reports', icon: FileText },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  const activeColor = nightMode ? 'text-[#FF3D5A]' : 'text-[#3DFF9A]';
  const activeBg = nightMode ? 'bg-[#3A1212]' : 'bg-[#163326]';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F14]/95 backdrop-blur border-t border-[#2A3340] px-2 py-1.5 font-mono select-none">
      <div className="max-w-md mx-auto grid grid-cols-6 gap-1 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeRoute(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all relative ${
                isActive ? `${activeBg} ${activeColor}` : 'text-[#9AA6B2] hover:text-[#D5DCE3]'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-semibold leading-tight">{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-[#FFB020] text-[#000] text-[9px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Pause / Resume Action */}
        <button
          onClick={onTogglePause}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all border border-[#2A3340] ${
            isPaused
              ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]'
              : 'bg-[#141A22] text-[#9AA6B2] hover:text-white'
          }`}
          title={isPaused ? 'Resume live RF monitor' : 'Freeze current display state'}
        >
          {isPaused ? <Play className="w-4 h-4 mb-0.5" /> : <Pause className="w-4 h-4 mb-0.5" />}
          <span className="text-[10px] font-bold leading-tight">
            {isPaused ? 'Resume' : 'Pause'}
          </span>
        </button>
      </div>
    </nav>
  );
};
