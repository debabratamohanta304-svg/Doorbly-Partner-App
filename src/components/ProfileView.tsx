import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  FileText,
  LogOut,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { partner, logout, verifyKYC, setActiveTab } = useApp();
  const [showKYCAction, setShowKYCAction] = useState(false);

  if (!partner) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header Card */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md text-center flex flex-col items-center relative overflow-hidden">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md bg-slate-700">
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
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
              partner.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
            }`}
          />
        </div>

        <h1 className="text-base font-bold text-white mt-3">{partner.fullName}</h1>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
          <span className="font-mono text-blue-400 font-semibold">{partner.id}</span>
          <span aria-hidden="true">·</span>
          <span>{partner.serviceCategory}</span>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            ★ {partner.rating} / 5.0
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({partner.ratingCount} reviews)
          </span>
        </div>
      </div>

      {/* KYC / Identity Verification Card */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              KYC & Identity Verification
            </h2>
          </div>
          <span
            className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
              partner.kycStatus === 'VERIFIED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : partner.kycStatus === 'PENDING'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {partner.kycStatus}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Document Type:</span>
            <span className="text-slate-200 font-semibold">{partner.idType}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Document Number:</span>
            <span className="text-slate-200 font-mono font-semibold">{partner.idNumber}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Status:</span>
            <span
              className={
                partner.kycStatus === 'VERIFIED'
                  ? 'text-emerald-400 font-semibold'
                  : 'text-amber-400 font-semibold'
              }
            >
              {partner.kycStatus === 'VERIFIED'
                ? 'Government Identity Verified'
                : 'Pending Admin Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* Partner Personal & Contact Details */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Contact & Location Details
        </h2>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Phone className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400">Mobile Number</div>
              <div className="text-white font-mono font-semibold">{partner.mobile}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Mail className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400">Email Address</div>
              <div className="text-white truncate font-medium">{partner.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400">Service Area & District</div>
              <div className="text-white font-medium">
                {partner.serviceArea} ({partner.district})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Specialties */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-2.5">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Registered Skills
        </h2>

        <div className="flex flex-wrap gap-1.5">
          {partner.skills.map((sk, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium bg-slate-900 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700"
            >
              {sk}
            </span>
          ))}
        </div>
      </div>

      {/* Sign Out / Account Action */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full h-12 rounded-2xl border border-slate-700 hover:bg-slate-800 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Partner Account</span>
        </button>
      </div>
    </div>
  );
};
