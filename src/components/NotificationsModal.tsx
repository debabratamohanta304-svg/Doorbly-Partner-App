import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Bell,
  Briefcase,
  ShieldCheck,
  IndianRupee,
  CheckCircle,
  Megaphone,
  X,
} from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const {
    notifications,
    showNotifModal,
    setShowNotifModal,
    markNotificationsRead,
    setActiveTab,
  } = useApp();

  if (!showNotifModal) return null;

  const handleClose = () => {
    markNotificationsRead();
    setShowNotifModal(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_JOB':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'MEMBERSHIP':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case 'PAYMENT':
        return <IndianRupee className="w-4 h-4 text-emerald-400" />;
      default:
        return <Megaphone className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Partner Notifications</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No notifications yet. You're up to date!
            </div>
          ) : (
            notifications.map((n) => {
              const timeStr = new Date(n.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border text-xs space-y-1 transition-all ${
                    n.read
                      ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                      : 'bg-slate-800 border-blue-500/30 text-slate-200 shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-slate-900 shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <span className="font-bold text-white text-xs">{n.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pl-7 leading-relaxed">{n.message}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 pt-2 border-t border-slate-800 flex justify-between">
          <button
            onClick={markNotificationsRead}
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Mark all read
          </button>
          <button
            onClick={handleClose}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
