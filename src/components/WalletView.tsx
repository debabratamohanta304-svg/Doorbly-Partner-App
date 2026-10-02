import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Wallet,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const { partner, requestPayout } = useApp();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState<number>(500);
  const [payoutType, setPayoutType] = useState<'UPI' | 'BANK'>('UPI');
  const [upiId, setUpiId] = useState('rajesh.partner@okhdfcbank');
  const [bankAcc, setBankAcc] = useState('5010029482910');
  const [isProcessing, setIsProcessing] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!partner) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPayoutSuccess(null);
    setIsProcessing(true);

    const success = await requestPayout(
      amount,
      payoutType === 'UPI' ? upiId : undefined,
      payoutType === 'BANK' ? bankAcc : undefined
    );

    setIsProcessing(false);
    if (success) {
      setPayoutSuccess(`Instant payout of ₹${amount} sent to your ${payoutType}!`);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setPayoutSuccess(null);
      }, 2000);
    } else {
      setErrorMsg('Failed to process payout. Check available balance.');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Wallet Balance Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900/90 via-slate-900 to-slate-900 border border-blue-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
            Available Wallet Balance
          </span>
          <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            Instant IMPS Active
          </span>
        </div>

        <div className="text-3xl font-extrabold text-white mt-2 tabular-nums">
          ₹{partner.wallet.availableBalance.toLocaleString('en-IN')}
        </div>

        <p className="text-xs text-slate-300 mt-1">
          Direct payout to your linked UPI ID or bank account anytime.
        </p>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Min. payout ₹200</span>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={partner.wallet.availableBalance < 200}
            className={`min-h-[44px] px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95 ${
              partner.wallet.availableBalance >= 200
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-xs text-slate-400">Today's Earnings</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
            ₹{partner.wallet.todayEarnings}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {partner.wallet.todayCompletedJobs} jobs today
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80">
          <div className="text-xs text-slate-400">Lifetime Earnings</div>
          <div className="text-xl font-bold text-white mt-1 tabular-nums">
            ₹{partner.wallet.totalEarnings.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {partner.wallet.totalCompletedJobs} jobs total
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Transaction Activity
          </h2>
          <span className="text-[11px] text-slate-500">
            {partner.wallet.transactions.length} records
          </span>
        </div>

        {partner.wallet.transactions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 rounded-2xl bg-slate-800/40 border border-slate-800">
            No transactions yet. Complete customer jobs to see credits.
          </div>
        ) : (
          <div className="space-y-2">
            {partner.wallet.transactions.map((txn) => {
              const isCredit = txn.amount > 0;
              const dateStr = new Date(txn.timestamp).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              });
              const timeStr = new Date(txn.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={txn.id}
                  className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : txn.type === 'MEMBERSHIP'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">
                        {txn.description}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {dateStr} at {timeStr}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold ${
                        isCredit ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {isCredit ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {txn.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Instant Partner Payout</h3>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {payoutSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">Payout Dispatched!</div>
                <p className="text-xs text-slate-300">{payoutSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Withdrawal Amount</span>
                    <span>Max: ₹{partner.wallet.availableBalance}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={200}
                      max={partner.wallet.availableBalance}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center gap-2">
                  {[200, 500, 1000, partner.wallet.availableBalance].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                    >
                      {val === partner.wallet.availableBalance ? 'All' : `₹${val}`}
                    </button>
                  ))}
                </div>

                {/* Method selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutType('UPI')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      payoutType === 'UPI'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutType('BANK')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      payoutType === 'BANK'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Bank IMPS
                  </button>
                </div>

                {payoutType === 'UPI' ? (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Registered UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAcc}
                      onChange={(e) => setBankAcc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                )}

                {errorMsg && (
                  <div className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing Payout...' : `Transfer ₹${amount}`}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
