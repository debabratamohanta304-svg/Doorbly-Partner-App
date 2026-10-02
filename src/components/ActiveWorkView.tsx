import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  MapPin,
  Phone,
  Clock,
  Play,
  CheckCircle,
  IndianRupee,
  Navigation,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Plus,
  QrCode,
  Banknote,
  ArrowRight,
  Receipt,
  FileCheck2,
} from 'lucide-react';

export const ActiveWorkView: React.FC = () => {
  const {
    activeBooking,
    navigateJob,
    arriveJob,
    startWork,
    finishWork,
    collectPayment,
    setActiveTab,
    partner,
  } = useApp();

  // Material / Parts add-on inputs
  const [partsAmount, setPartsAmount] = useState<number>(0);
  const [partsNotes, setPartsNotes] = useState<string>('');
  const [showAddParts, setShowAddParts] = useState(false);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'UPI_QR' | 'CASH'>('UPI_QR');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live timer for active work
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeBooking || activeBooking.status !== 'WORK_STARTED') {
      setElapsedSeconds(0);
      return;
    }

    const startTime = activeBooking.startTime
      ? new Date(activeBooking.startTime).getTime()
      : Date.now();

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeBooking?.status, activeBooking?.startTime]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!activeBooking) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4 border border-slate-700">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">No Active Work Right Now</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          When you accept a nearby customer service request, the live job tracker will guide you through navigation, work timer, and payment collection.
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { status, customerLocation } = activeBooking;

  // External Google Maps Navigation URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.lat},${customerLocation.lng}&travelmode=driving`;

  const handleStartWork = async () => {
    setIsProcessing(true);
    await startWork(activeBooking.id);
    setIsProcessing(false);
  };

  const handleFinishWork = async () => {
    setIsProcessing(true);
    await finishWork(activeBooking.id, partsAmount, partsNotes);
    setIsProcessing(false);
  };

  const handleCollectPayment = async () => {
    setIsProcessing(true);
    await collectPayment(
      activeBooking.id,
      paymentMethod,
      paymentMethod === 'UPI_QR' ? `UPI-REC-${Date.now().toString().slice(-6)}` : `CASH-REC-${Date.now().toString().slice(-6)}`
    );
    setIsProcessing(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Work Status Stepper Bar */}
      <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
          <span
            className={
              ['ASSIGNED', 'NAVIGATING', 'ARRIVED'].includes(status)
                ? 'text-blue-400 font-bold'
                : 'text-slate-500'
            }
          >
            1. Reach Location
          </span>
          <span
            className={
              status === 'WORK_STARTED' ? 'text-amber-400 font-bold' : 'text-slate-500'
            }
          >
            2. Service Execution
          </span>
          <span
            className={
              ['WORK_COMPLETED', 'PAYMENT_PENDING'].includes(status)
                ? 'text-emerald-400 font-bold'
                : 'text-slate-500'
            }
          >
            3. Collect Payment
          </span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-300 ${
              ['ASSIGNED', 'NAVIGATING', 'ARRIVED'].includes(status)
                ? 'w-1/3 bg-blue-500'
                : status === 'WORK_STARTED'
                ? 'w-2/3 bg-amber-500'
                : 'w-full bg-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Confirmed Work Card Header */}
      <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                #{activeBooking.id}
              </span>
              <span className="text-xs text-slate-400">{activeBooking.serviceCategory}</span>
            </div>
            <h1 className="text-base font-bold text-white mt-1.5 leading-snug">
              {activeBooking.serviceName}
            </h1>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400">Rate</span>
            <div className="text-sm font-bold text-emerald-400">
              ₹{activeBooking.baseRate}
              <span className="text-[10px] font-normal text-slate-400 ml-0.5">
                {activeBooking.pricingType === 'HOURLY' ? '/hr' : 'fixed'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer Details
            </span>
            <div className="text-sm font-bold text-white truncate">
              {activeBooking.customerName}
            </div>
            <div className="text-xs text-slate-300 font-mono mt-0.5">
              {activeBooking.customerPhone}
            </div>
          </div>

          <a
            href={`tel:${activeBooking.customerPhone}`}
            className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </a>
        </div>

        {/* Customer Location & Address */}
        <div className="mt-3 flex items-start gap-2.5 text-xs text-slate-300">
          <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">
              {activeBooking.customerLocation.address}
            </span>
            {activeBooking.customerLocation.landmark && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Landmark: {activeBooking.customerLocation.landmark}
              </p>
            )}
            <p className="text-[11px] text-blue-400 font-mono mt-0.5">
              Distance: ~{activeBooking.customerLocation.distanceKm} km from your current base
            </p>
          </div>
        </div>
      </div>

      {/* PHASE 1: REACH LOCATION & NAVIGATION */}
      {['ASSIGNED', 'NAVIGATING', 'ARRIVED'].includes(status) && (
        <div className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Step 1: Go to Customer Location
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              ETA: ~12 mins
            </span>
          </div>

          {/* Interactive Route Map Preview Simulation */}
          <div className="w-full h-40 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-3 select-none">
            {/* SVG stylized map routes */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Route line */}
              <path
                d="M 40 120 C 100 80, 150 130, 220 70 S 300 90, 360 40"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
            </svg>

            {/* Partner Origin Pin */}
            <div className="absolute left-8 bottom-6 flex flex-col items-center">
              <span className="text-[10px] font-bold text-blue-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-blue-500/40">
                You
              </span>
              <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/30"></div>
            </div>

            {/* Customer Destination Pin */}
            <div className="absolute right-10 top-6 flex flex-col items-center">
              <span className="text-[10px] font-bold text-rose-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-rose-500/40">
                Customer
              </span>
              <div className="w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-500/30 animate-bounce"></div>
            </div>

            {/* In-app navigation route info card */}
            <div className="relative z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-center">
              <span className="text-xs font-semibold text-white">
                Live Route Active ({activeBooking.customerLocation.distanceKm} km)
              </span>
              <p className="text-[10px] text-slate-400">Doorbly booking stays active in background</p>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* GO TO LOCATION (Opens Maps app / external navigation without cancelling booking) */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => navigateJob(activeBooking.id)}
              className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>GO TO LOCATION (Maps Navigation)</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </a>

            {/* Confirm Arrival at Location */}
            {status !== 'ARRIVED' ? (
              <button
                onClick={() => arriveJob(activeBooking.id)}
                className="h-11 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>I Have Reached Customer Location</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Arrived at Customer Doorstep. Ready to begin service.</span>
              </div>
            )}
          </div>

          {/* START WORK BUTTON - Primary CTA */}
          <div className="pt-2 border-t border-slate-700/60">
            <button
              onClick={handleStartWork}
              disabled={isProcessing}
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START WORK</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-1.5">
              Pressing Start Work triggers working duration meter and records arrival on backend.
            </p>
          </div>
        </div>
      )}

      {/* PHASE 2: DURING WORK (LIVE STOPWATCH & FINISH WORK) */}
      {status === 'WORK_STARTED' && (
        <div className="p-4 rounded-3xl bg-slate-800/90 border border-amber-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Work In Progress
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Started: {activeBooking.startTime ? new Date(activeBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
            </span>
          </div>

          {/* Live Working Duration Stopwatch */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Live Working Duration
            </span>
            <div className="text-4xl font-extrabold font-mono text-white mt-1 tracking-wider tabular-nums">
              {formatTimer(elapsedSeconds)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Rate: ₹{activeBooking.baseRate}/hr</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-semibold">
                Est. Bill: ₹
                {Math.max(
                  activeBooking.baseRate,
                  Math.round(
                    activeBooking.baseRate * Math.max(1, Math.ceil(elapsedSeconds / 1800) * 0.5)
                  )
                )}
              </span>
            </div>
          </div>

          {/* Optional: Add Extra Parts / Material Used */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Extra Parts / Hardware Used
              </span>
              <button
                type="button"
                onClick={() => setShowAddParts(!showAddParts)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                {showAddParts ? 'Cancel' : '+ Add Parts'}
              </button>
            </div>

            {showAddParts && (
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Material description (e.g., 16A Havells MCB switch)"
                  value={partsNotes}
                  onChange={(e) => setPartsNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Parts Amount (₹):</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={partsAmount || ''}
                    onChange={(e) => setPartsAmount(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FINISH WORK BUTTON */}
          <button
            onClick={handleFinishWork}
            disabled={isProcessing}
            className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            <span>FINISH WORK</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center">
            Stops timer, calculates bill breakdown, and generates payment collection card.
          </p>
        </div>
      )}

      {/* PHASE 3: FINAL AMOUNT & CUSTOMER PAYMENT COLLECTION */}
      {['WORK_COMPLETED', 'PAYMENT_PENDING'].includes(status) && (
        <div className="p-4 rounded-3xl bg-slate-800/90 border border-emerald-500/40 shadow-2xl space-y-4">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Work Completed · Payment Due
            </span>
            <div className="text-xs text-slate-400 mt-2">Amount to Collect from Customer</div>
            <div className="text-4xl font-black text-white mt-1 tabular-nums tracking-tight">
              ₹{activeBooking.bill?.finalAmountPayable || activeBooking.baseRate}
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5">
              Your Earnings: ₹{activeBooking.bill?.partnerShare || Math.round(activeBooking.baseRate * 0.85)}
            </div>
          </div>

          {/* Detailed Invoice Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Service Charge ({activeBooking.durationMinutes || 45} mins worked)</span>
              <span className="text-slate-200 font-mono font-semibold">
                ₹{activeBooking.bill?.serviceAmount || activeBooking.baseRate}
              </span>
            </div>

            {Boolean(activeBooking.bill?.materialPartsAmount) && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Parts / Material ({activeBooking.bill?.materialNotes || 'Parts'})</span>
                <span className="text-slate-200 font-mono font-semibold">
                  ₹{activeBooking.bill?.materialPartsAmount}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span>Applicable GST (5%)</span>
              <span className="text-slate-200 font-mono font-semibold">
                ₹{activeBooking.bill?.taxes || 20}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-white">
              <span>Total Payable</span>
              <span className="text-emerald-400 font-mono">
                ₹{activeBooking.bill?.finalAmountPayable || activeBooking.baseRate}
              </span>
            </div>
          </div>

          {/* Payment Method Selector (UPI QR or Cash) */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Select Customer Payment Method
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI_QR')}
                className={`min-h-[44px] p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition-all ${
                  paymentMethod === 'UPI_QR'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>UPI Dynamic QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`min-h-[44px] p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Cash on Service</span>
              </button>
            </div>
          </div>

          {/* UPI QR Display (if UPI selected) */}
          {paymentMethod === 'UPI_QR' && (
            <div className="p-4 rounded-2xl bg-white text-slate-900 text-center flex flex-col items-center justify-center">
              <div className="w-40 h-40 bg-white p-2 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-inner">
                {/* Visual simulated QR code */}
                <div className="w-full h-full bg-slate-900 p-2 rounded flex flex-col justify-between text-white">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-white rounded-sm border-2 border-slate-900"></div>
                    <div className="w-8 h-8 bg-white rounded-sm border-2 border-slate-900"></div>
                  </div>
                  <div className="text-[9px] font-mono text-center tracking-widest text-blue-300">
                    DOORBLY · PAY
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-8 h-8 bg-white rounded-sm border-2 border-slate-900"></div>
                    <span className="text-[10px] font-bold font-mono">
                      ₹{activeBooking.bill?.finalAmountPayable}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-2">
                Scan with any UPI App (GPay, PhonePe, Paytm)
              </p>
              <span className="text-[11px] font-mono text-slate-600">
                UPI ID: doorbly.partner.{partner?.id?.toLowerCase()}@icici
              </span>
            </div>
          )}

          {/* Confirm Payment Collected Button */}
          <button
            onClick={handleCollectPayment}
            disabled={isProcessing}
            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            <span>CONFIRM PAYMENT COLLECTED</span>
          </button>
        </div>
      )}

      {/* PHASE 4: COMPLETED SUMMARY RECEIPT */}
      {status === 'COMPLETED' && (
        <div className="p-5 rounded-3xl bg-slate-800/90 border border-emerald-500/50 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/40">
            <FileCheck2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Booking Completed!</h2>
            <p className="text-xs text-slate-300 mt-1">
              Payment of ₹{activeBooking.bill?.finalAmountPayable} successfully collected.
            </p>
            <div className="text-sm font-bold text-emerald-400 mt-1">
              ₹{activeBooking.bill?.partnerShare} credited to your Doorbly Wallet.
            </div>
          </div>

          {/* Quick Receipt Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-left text-xs space-y-1.5 border border-slate-800 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Receipt Ref:</span>
              <span className="text-white">{activeBooking.payment?.transactionRef || 'REC-8921'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Method:</span>
              <span className="text-white">{activeBooking.payment?.method || 'UPI'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Duration:</span>
              <span className="text-white">{activeBooking.durationMinutes || 45} mins</span>
            </div>
          </div>

          {/* Ready for Next Work CTA */}
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95 transition-all"
            >
              <span>Return to Dashboard (Ready for Next Work)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              You are automatically online and ready to receive nearby jobs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
