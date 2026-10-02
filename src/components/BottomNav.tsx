import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  ShieldCheck,
  User,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, activeBooking, partner } = useApp();

  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'work' as const,
      label: 'Work',
      icon: Briefcase,
      badge: activeBooking ? 'Active' : null,
    },
    {
      id: 'wallet' as const,
      label: 'Wallet',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'membership' as const,
      label: 'Plan',
      icon: ShieldCheck,
      badge:
        partner?.membership?.status === 'EXPIRED'
          ? '!'
          : partner?.membership?.daysRemaining && partner.membership.daysRemaining <= 3
          ? `${partner.membership.daysRemaining}d`
          : null,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-5 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 max-w-[420px] mx-auto">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative cursor-pointer group transition-all"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive
                      ? 'text-blue-500 scale-110'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full text-white ${
                      tab.badge === '!'
                        ? 'bg-rose-500'
                        : tab.badge === 'Active'
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-blue-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-blue-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-500 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
