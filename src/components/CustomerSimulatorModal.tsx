import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Sparkles,
  MapPin,
  Clock,
  IndianRupee,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { ServiceCategory } from '../types/index.ts';

export const CustomerSimulatorModal: React.FC = () => {
  const { partner, showSimulator, setShowSimulator, dispatchSimulation } = useApp();

  const [customerName, setCustomerName] = useState('Priya Venkatesh');
  const [customerPhone, setCustomerPhone] = useState('+91 98450 11982');
  const [address, setAddress] = useState('Flat 402, Palm Meadows Heights, Wind Tunnel Rd');
  const [landmark, setLandmark] = useState('Near Manipal Hospital');
  const [serviceName, setServiceName] = useState(
    partner?.serviceCategory === 'Electrician'
      ? 'Emergency Main Switchboard Sparking & Inverter Repair'
      : `${partner?.serviceCategory || 'Service'} Urgent Inspection & Repair`
  );
  const [category, setCategory] = useState<ServiceCategory>(
    partner?.serviceCategory || 'Electrician'
  );
  const [pricingType, setPricingType] = useState<'HOURLY' | 'FIXED'>('HOURLY');
  const [baseRate, setBaseRate] = useState<number>(450);
  const [estimatedDuration, setEstimatedDuration] = useState('45 - 60 mins');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (!showSimulator) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const partnerLat = partner?.currentLocation?.lat || 12.9716;
    const partnerLng = partner?.currentLocation?.lng || 77.6412;

    const res = await dispatchSimulation({
      customerName,
      customerPhone,
      customerLocation: {
        address,
        landmark,
        lat: partnerLat + 0.015,
        lng: partnerLng + 0.012,
      },
      serviceName,
      serviceCategory: category,
      pricingType,
      baseRate: Number(baseRate),
      estimatedDuration,
      forcedPartnerId: partner?.id,
    });

    setIsSubmitting(false);
    setStatusMessage({ text: res.message, ok: res.success });
    if (res.success) {
      setTimeout(() => {
        setShowSimulator(false);
        setStatusMessage(null);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Customer Booking Simulator</h3>
          </div>
          <button
            onClick={() => setShowSimulator(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Simulate a real nearby customer placing a booking to test the Doorbly real-time matching, ringtone alert, navigation, and payment workflow!
        </p>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.ok
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
            }`}
          >
            {statusMessage.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSimulate} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Service Work Name</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Electrician">Electrician</option>
                <option value="Plumbing">Plumbing</option>
                <option value="AC & Appliance Repair">AC & Appliance Repair</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Home Cleaning">Home Cleaning</option>
                <option value="Painting">Painting</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Pricing Model</label>
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as 'HOURLY' | 'FIXED')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="HOURLY">Hourly Rate</option>
                <option value="FIXED">Fixed Rate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-1">Base Rate (₹)</label>
              <input
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Est. Duration</label>
              <input
                type="text"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Customer Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all mt-4"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Dispatching to Nearest Partner...' : 'Dispatch Request Now'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
