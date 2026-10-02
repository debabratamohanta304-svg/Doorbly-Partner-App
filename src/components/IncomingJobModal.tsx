import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const IncomingJobModal: React.FC = () => {
  const {
    incomingBooking,
    showIncomingModal,
    acceptJob,
    rejectJob,
    soundEnabled,
    toggleSound,
  } = useApp();

  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!showIncomingModal || !incomingBooking) {
      setTimeLeft(30);
      return;
    }

    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          rejectJob(incomingBooking.id, 'Timeout: Partner missed acceptance window');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showIncomingModal, incomingBooking?.id]);

  if (!showIncomingModal || !incomingBooking) return null;

  const progressPercent = (timeLeft / 30) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-[420px] bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-hidden relative">
        {/* Urgent Animated Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              New Nearby Request
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Alert Ringtone"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Progress Bar for Acceptance Window */}
        <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft < 10 ? 'bg-rose-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Service Title & Category */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{incomingBooking.serviceCategory}</span>
            <span className="font-mono text-slate-500">#{incomingBooking.id}</span>
          </div>
          <h2 className="text-base font-bold text-white mt-1 leading-snug">
            {incomingBooking.serviceName}
          </h2>
        </div>

        {/* Location & Distance Card */}
        <div className="mt-3.5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  Customer Location
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {incomingBooking.customerLocation.distanceKm} km away
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                {incomingBooking.customerLocation.address}
              </p>
              {incomingBooking.customerLocation.landmark && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Landmark: {incomingBooking.customerLocation.landmark}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Work Value & Expected Duration */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
              <span>Est. Value</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              ₹{incomingBooking.baseRate}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {incomingBooking.pricingType === 'HOURLY' ? '/ hr' : 'fixed'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Est. Duration</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {incomingBooking.estimatedDuration || '45 - 60 mins'}
            </div>
          </div>
        </div>

        {/* Customer Contact Permission Note */}
        <p className="text-[11px] text-slate-400 text-center mt-3">
          Customer phone & exact navigation unlock immediately upon acceptance.
        </p>

        {/* Thumb-friendly Accept / Reject Actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => rejectJob(incomingBooking.id, 'Declined by partner')}
            className="h-12 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>Decline</span>
          </button>

          <button
            onClick={() => acceptJob(incomingBooking.id)}
            className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Accept Work</span>
          </button>
        </div>
      </div>
    </div>
  );
};
