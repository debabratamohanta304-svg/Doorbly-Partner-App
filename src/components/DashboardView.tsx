import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  MapPin,
  IndianRupee,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    partner,
    activeBooking,
    setActiveTab,
    setShowSimulator,
  } = useApp();

  if (!partner) return null;

  const isOnline = partner.isOnline;
  const membershipActive = partner.membership.status === 'ACTIVE';

  return (
    <div className="p-4 space-y-4">
      {/* Partner Identity Card */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-inner bg-slate-700">
              <img
                src={partner.profilePhoto || '/src/assets/images/partner_avatar_1790879508326.jpg'}
                alt={partner.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-bold text-white truncate">
                {partner.fullName}
              </h1>
              <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                {partner.id}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
              <span className="font-medium text-slate-200">{partner.serviceCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400 truncate max-w-[130px]">
                {partner.district}
              </span>
            </div>

            {/* Membership badge link */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                onClick={() => setActiveTab('membership')}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    membershipActive ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                />
                <span>
                  {membershipActive
                    ? `Membership Active (${partner.membership.daysRemaining}d left)`
                    : 'Membership Inactive (Pay ₹370)'}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Current Partner GPS Location */}
        <div className="mt-3.5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{partner.currentLocation.address}</span>
          </div>
          <span className="shrink-0 text-[10px] text-slate-500 font-mono">GPS Ready</span>
        </div>
      </div>

      {/* Active Work Banner (if currently handling a job) */}
      {activeBooking && (
        <div className="p-4 rounded-3xl bg-blue-950/70 border border-blue-500/40 shadow-xl relative overflow-hidden animate-in fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                Active Job In Progress
              </span>
              <h2 className="text-sm font-bold text-white mt-1">
                {activeBooking.serviceName}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Customer: {activeBooking.customerName}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-400/30">
              {activeBooking.status.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('work')}
            className="mt-3 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 cursor-pointer active:scale-95 transition-all"
          >
            <span>Open Active Work Card</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Today's Metrics / Financial Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            <span>Today's Earnings</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">
            ₹{partner.wallet.todayEarnings}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Lifetime: <span className="text-slate-300 font-semibold">₹{partner.wallet.totalEarnings}</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Completed Today</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">
            {partner.wallet.todayCompletedJobs}
            <span className="text-xs font-normal text-slate-400 ml-1">jobs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total Completed: <span className="text-slate-300 font-semibold">{partner.wallet.totalCompletedJobs}</span>
          </div>
        </div>
      </div>

      {/* Available Balance & Quick Withdraw */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Available Wallet Balance</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5 tabular-nums">
            ₹{partner.wallet.availableBalance}
          </div>
        </div>

        <button
          onClick={() => setActiveTab('wallet')}
          className="h-10 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <span>Wallet</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </div>
    </div>
  );
};
