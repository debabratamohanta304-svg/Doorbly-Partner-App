import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Zap,
  CreditCard,
  QrCode,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const MembershipView: React.FC = () => {
  const { partner, payMembership, toggleOnline } = useApp();
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!partner) return null;

  const { membership } = partner;
  const isActive = membership.status === 'ACTIVE';

  const startDateStr = new Date(membership.startDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const expiryDateStr = new Date(membership.expiryDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const progressPercent = Math.min(100, Math.max(0, (membership.daysRemaining / 30) * 100));

  const handlePay = async () => {
    setIsProcessing(true);
    const success = await payMembership(paymentMethod);
    setIsProcessing(false);
    if (success) {
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setShowPayModal(false);
      }, 1500);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Membership Plan Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Doorbly Partner Pro
          </span>
          <span
            className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isActive ? 'ACTIVE' : 'EXPIRED'}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white">₹370</span>
            <span className="text-xs text-slate-300">/ 30 Days</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Mandatory monthly platform subscription to receive nearby customer service dispatches.
          </p>
        </div>

        {/* Validity Progress Meter */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Validity Period</span>
            <span className="font-mono text-emerald-400 font-bold">
              {membership.daysRemaining} days remaining
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                membership.daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
            <span>Started: {startDateStr}</span>
            <span>Expires: {expiryDateStr}</span>
          </div>
        </div>

        {/* Instant Renew Button */}
        <div className="mt-4">
          <button
            onClick={() => setShowPayModal(true)}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isActive ? 'Renew / Extend Subscription (₹370)' : 'Pay ₹370 to Activate'}</span>
          </button>
        </div>
      </div>

      {/* Subscription Features & Partner Perks */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Membership Inclusions
        </h2>

        <div className="space-y-2 text-xs">
          {[
            'Unlimited nearby customer work requests within your service area',
            'Zero commission deductions on tips and custom hardware add-ons',
            'Instant real-time dispatch matching based on your live GPS location',
            'Verified Partner Badge displayed to prospective customers',
            'Direct instant payouts to your UPI ID or Bank account',
            '24/7 Partner Operations Helpline and dispute assistance',
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Information & Status Card */}
      <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Billing Verification
        </h2>
        <div className="flex justify-between text-slate-400">
          <span>Subscription Plan:</span>
          <span className="text-slate-200 font-semibold">{membership.plan}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Fee Amount:</span>
          <span className="text-slate-200 font-semibold font-mono">₹370 (Taxes included)</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Payment Status:</span>
          <span
            className={`font-semibold font-mono ${
              membership.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {membership.paymentStatus}
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Backend Verification:</span>
          <span className="text-blue-400 font-semibold">Verified on Server</span>
        </div>
      </div>

      {/* Checkout Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Doorbly Partner Subscription</h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {successNotice ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">Membership Activated!</div>
                <p className="text-xs text-slate-300">
                  ₹370 payment confirmed. 30 days validity added to your account.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-800 text-center">
                  <div className="text-xs text-slate-400">Total Subscription Fee</div>
                  <div className="text-2xl font-black text-white mt-0.5">₹370</div>
                  <span className="text-[11px] text-slate-400">Valid for 30 calendar days</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Select Payment Method
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'UPI' as const, label: 'Instant UPI (GPay, PhonePe, Paytm)', icon: QrCode },
                      { id: 'CARD' as const, label: 'Debit / Credit Card', icon: CreditCard },
                      { id: 'NETBANKING' as const, label: 'Net Banking', icon: Zap },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`w-full p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-all ${
                          paymentMethod === opt.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <opt.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Verifying with Bank...' : 'Confirm & Pay ₹370'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
