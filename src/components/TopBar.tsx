import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Bell, Sparkles, ShieldCheck } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    partner,
    unreadNotifCount,
    setShowNotifModal,
    setShowSimulator,
    activeTab,
    toggleOnline,
  } = useApp();

  const isOnline = partner?.isOnline ?? false;
  const membershipActive = partner?.membership?.status === 'ACTIVE';

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Partner Hub';
      case 'work':
        return 'Work Tracker';
      case 'wallet':
        return 'Partner Wallet';
      case 'membership':
        return 'Doorbly Membership';
      case 'profile':
        return 'Partner Profile';
      default:
        return 'Doorbly Partner';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 flex items-center justify-between">
      {/* Brand & Partner Identification */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20 overflow-hidden shrink-0 border border-blue-400/30">
          <img
            src="/src/assets/images/doorbly_app_logo_1790879492285.jpg"
            alt="Doorbly"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-white text-xs sm:text-sm">Doorbly</span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-blue-400">
              Partner
            </span>
          </div>
          {partner && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{partner.serviceCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 font-mono text-[9px]">{partner.id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Controls & Rapido Mini Duty Switch */}
      <div className="flex items-center gap-2">
        {/* Rapido Style Mini Duty On/Off Switch */}
        {partner && (
          <button
            onClick={() => toggleOnline()}
            className={`min-h-[44px] flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
              isOnline
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-800/90 border-slate-700 text-slate-400'
            }`}
            title={isOnline ? 'You are ONLINE. Click to go offline' : 'You are OFFLINE. Click to go online'}
          >
            {/* Sliding Pill Indicator */}
            <div
              className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors duration-200 ${
                isOnline ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-md"></div>
            </div>

            <span className="text-[11px] font-mono font-bold tracking-tight uppercase">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>
        )}

        {/* Notifications Icon Button */}
        <button
          onClick={() => setShowNotifModal(true)}
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
          )}
        </button>
      </div>
    </header>
  );
};
