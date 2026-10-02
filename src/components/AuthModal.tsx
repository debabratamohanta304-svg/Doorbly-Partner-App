import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { ServiceCategory } from '../types/index.ts';

export const AuthModal: React.FC = () => {
  const { login, register, partner, isLoading, error } = useApp();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Registration form state
  const [fullName, setFullName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('Electrician');
  const [skillsText, setSkillsText] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState<'Aadhaar Card' | 'PAN Card' | 'Voter ID'>('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // If already logged in, do not render
  if (partner) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(identifier, password);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    await register({
      fullName,
      mobile: regMobile,
      email: regEmail,
      serviceCategory,
      skills,
      serviceArea,
      district,
      address,
      idType,
      idNumber,
      password: regPassword,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Brand Lockup */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-600/30 overflow-hidden border border-blue-400/40">
            <img
              src="/src/assets/images/doorbly_app_logo_1790879492285.jpg"
              alt="Doorbly"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-lg font-extrabold text-white mt-2">Doorbly Partner</h1>
          <p className="text-xs text-slate-400">
            {mode === 'LOGIN'
              ? 'Partner Mobile Application Login'
              : 'Register as Verified Service Partner'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-800 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('LOGIN')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              mode === 'LOGIN' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Partner Login
          </button>
          <button
            type="button"
            onClick={() => setMode('REGISTER')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              mode === 'REGISTER' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            New Registration
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">
                Partner ID / Registered Mobile / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. DBY-PRT-8942 or +91 98450..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer mt-2"
            >
              <span>{isLoading ? 'Verifying Partner...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>
        )}

        {/* REGISTRATION FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sunil Kumar"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Service Category</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value as ServiceCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="AC & Appliance Repair">AC & Appliance</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Home Cleaning">Home Cleaning</option>
                  <option value="Painting">Painting</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">District / Region</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Bengaluru Urban"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Skills & Specialties (comma-separated)</label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Wiring, MCB Tripping, Inverter"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Base Workshop / Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, Landmark"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* KYC Section */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                ID & KYC Verification
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">ID Document</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">ID / Number</label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="XXXX-XXXX-1234"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Create Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer mt-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'Creating Account...' : 'Register & Continue to KYC'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Requires ₹370/month membership payment and KYC approval before going online.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
