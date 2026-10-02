import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import type { Booking } from '../types/index.ts';
import {
  Calendar,
  Clock,
  IndianRupee,
  CheckCircle2,
  Filter,
  User,
  MapPin,
} from 'lucide-react';

export const WorkHistoryView: React.FC = () => {
  const { partner } = useApp();
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/partner/${partner.id}/history?filter=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [partner?.id, filter]);

  if (!partner) return null;

  return (
    <div className="p-4 space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">Work History</h1>
          <p className="text-xs text-slate-400">Completed jobs and earnings</p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl border border-slate-700/80">
          {(['all', 'today', 'week', 'month'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Kicker */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Showing {bookings.length} completed bookings</span>
        <span>
          Total:{' '}
          <strong className="text-emerald-400 font-mono">
            ₹{bookings.reduce((sum, b) => sum + (b.bill?.partnerShare || 0), 0)}
          </strong>
        </span>
      </div>

      {/* History Cards Feed */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading work history...</div>
      ) : bookings.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-slate-800/40 border border-slate-700/60">
          <Calendar className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-300">No completed jobs found for this period.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Complete active service requests to see your verified job logs here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const dateStr = new Date(booking.finishTime || booking.dispatchTime).toLocaleDateString(
              'en-IN',
              { day: 'numeric', month: 'short', year: 'numeric' }
            );
            const timeStr = new Date(booking.finishTime || booking.dispatchTime).toLocaleTimeString(
              'en-IN',
              { hour: '2-digit', minute: '2-digit' }
            );

            return (
              <div
                key={booking.id}
                className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-md space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-mono text-blue-400 font-bold">#{booking.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dateStr} at {timeStr}</span>
                    </div>
                    <h2 className="text-sm font-bold text-white mt-0.5 leading-snug">
                      {booking.serviceName}
                    </h2>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400">Earned</span>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      ₹{booking.bill?.partnerShare || 400}
                    </div>
                  </div>
                </div>

                {/* Customer & Location */}
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-200 truncate">{booking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{booking.durationMinutes || 40} mins</span>
                  </div>
                </div>

                {/* Financial Details Row */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span>Amount Collected: ₹{booking.bill?.finalAmountPayable || booking.baseRate}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{booking.payment?.method === 'UPI_QR' ? 'UPI' : 'Cash'}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
