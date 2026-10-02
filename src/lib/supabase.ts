import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Partner, Booking, AppNotification } from '../types/index.ts';

// Helper to resolve environment variables in Vite (import.meta.env) or Node.js (process.env)
const resolveEnv = (key: string, viteKey: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key] as string;
    if (process.env[viteKey]) return process.env[viteKey] as string;
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      if (metaEnv[viteKey]) return metaEnv[viteKey];
      if (metaEnv[key]) return metaEnv[key];
    }
  } catch {
    // ignore
  }
  return fallback;
};

export const supabaseUrl = resolveEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', '');
export const supabaseAnonKey = resolveEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', '');
export const supabaseServiceKey = resolveEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', '');

const activeKey = supabaseServiceKey || supabaseAnonKey;
export const isSupabaseConfigured = Boolean(supabaseUrl && activeKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, activeKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

// Initial seed partner
const seedPartner: Partner = {
  id: 'DBY-PRT-8821',
  fullName: 'Rajesh Kumar',
  mobile: '+91 98765 43210',
  email: 'rajesh.kumar@doorbly.in',
  serviceCategory: 'Electrician',
  skills: ['Wiring & Rewiring', 'Inverter Installation', 'Switchboard Repair', 'Appliance Tripping'],
  serviceArea: 'Indiranagar & Domlur',
  district: 'Bengaluru Urban',
  address: '14/B, 100ft Road, HAL 2nd Stage, Indiranagar',
  idType: 'Aadhaar Card',
  idNumber: 'XXXX-XXXX-9021',
  kycStatus: 'VERIFIED',
  profilePhoto: '/src/assets/images/partner_avatar_1790879508326.jpg',
  isOnline: true,
  currentLocation: {
    lat: 12.9716,
    lng: 77.6412,
    address: 'Indiranagar Metro Station, 100ft Road',
    district: 'Bengaluru Urban',
    lastUpdated: new Date().toISOString(),
  },
  membership: {
    plan: 'Doorbly Pro Partner Membership',
    monthlyFee: 370,
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 24,
    paymentStatus: 'PAID',
    autoRenew: true,
  },
  wallet: {
    availableBalance: 4250,
    todayEarnings: 1850,
    totalEarnings: 48600,
    todayCompletedJobs: 3,
    totalCompletedJobs: 84,
    pendingWithdrawals: 0,
    transactions: [
      {
        id: 'TXN-901',
        bookingId: 'DBY-BK-1049',
        type: 'EARNING',
        amount: 850,
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        description: 'Completed: MCB Tripping & Electrical Check',
      },
      {
        id: 'TXN-900',
        bookingId: 'DBY-BK-1048',
        type: 'EARNING',
        amount: 600,
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        description: 'Completed: Ceiling Fan Installation (2 Units)',
      },
      {
        id: 'TXN-899',
        type: 'WITHDRAWAL',
        amount: -3000,
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'UPI Payout transferred to rajesh@okhdfcbank',
      },
    ],
  },
  rating: 4.88,
  ratingCount: 92,
  createdAt: new Date().toISOString(),
};

// In-memory fallback repository for resilient offline/development data
class MemoryStorage {
  private partners: Map<string, Partner & { password?: string }> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private notifications: Map<string, AppNotification[]> = new Map();

  constructor() {
    this.partners.set(seedPartner.id, { ...seedPartner, password: 'password123' });
  }

  getPartners(): (Partner & { password?: string })[] {
    return Array.from(this.partners.values());
  }

  getPartner(id: string): (Partner & { password?: string }) | undefined {
    return this.partners.get(id);
  }

  savePartner(partner: Partner & { password?: string }) {
    this.partners.set(partner.id, { ...partner });
  }

  updatePartner(id: string, updates: Partial<Partner>) {
    const existing = this.partners.get(id);
    if (existing) {
      this.partners.set(id, { ...existing, ...updates });
    }
  }

  getBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  getBooking(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  saveBooking(booking: Booking) {
    this.bookings.set(booking.id, { ...booking });
  }

  updateBooking(id: string, updates: Partial<Booking>) {
    const existing = this.bookings.get(id);
    if (existing) {
      this.bookings.set(id, { ...existing, ...updates });
    }
  }

  getNotifications(partnerId: string): AppNotification[] {
    return this.notifications.get(partnerId) || [];
  }

  saveNotification(notification: AppNotification) {
    const pId = notification.partnerId || 'default';
    const list = this.notifications.get(pId) || [];
    list.unshift(notification);
    this.notifications.set(pId, list);
  }

  markAllNotificationsRead(partnerId: string) {
    const list = this.notifications.get(partnerId) || [];
    this.notifications.set(
      partnerId,
      list.map((n) => ({ ...n, read: true }))
    );
  }
}

const memory = new MemoryStorage();

// Unified Supabase Storage Service
export const supabaseStorage = {
  isUsingLiveSupabase(): boolean {
    return Boolean(supabase);
  },

  async getAllPartners(): Promise<(Partner & { password?: string })[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('partners').select('*');
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            firebaseUid: row.firebase_uid || row.firebaseUid,
            fullName: row.full_name || row.fullName,
            mobile: row.mobile,
            email: row.email,
            serviceCategory: row.service_category || row.serviceCategory,
            skills: row.skills || [],
            serviceArea: row.service_area || row.serviceArea,
            district: row.district,
            address: row.address,
            idType: row.id_type || row.idType,
            idNumber: row.id_number || row.idNumber,
            kycStatus: row.kyc_status || row.kycStatus,
            profilePhoto: row.profile_photo || row.profilePhoto,
            isOnline: Boolean(row.is_online ?? row.isOnline),
            currentLocation: row.current_location || row.currentLocation,
            membership: row.membership || row.membership,
            wallet: row.wallet || row.wallet,
            rating: row.rating || 5.0,
            ratingCount: row.rating_count || row.ratingCount || 0,
            password: row.password,
            createdAt: row.created_at || row.createdAt,
          }));
        }
      } catch (err) {
        console.warn('Supabase query failed, using resilient local storage:', err);
      }
    }
    return memory.getPartners();
  },

  async getPartnerById(id: string): Promise<(Partner & { password?: string }) | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('partners').select('*').eq('id', id).single();
        if (!error && data) {
          return {
            id: data.id,
            firebaseUid: data.firebase_uid || data.firebaseUid,
            fullName: data.full_name || data.fullName,
            mobile: data.mobile,
            email: data.email,
            serviceCategory: data.service_category || data.serviceCategory,
            skills: data.skills || [],
            serviceArea: data.service_area || data.serviceArea,
            district: data.district,
            address: data.address,
            idType: data.id_type || data.idType,
            idNumber: data.id_number || data.idNumber,
            kycStatus: data.kyc_status || data.kycStatus,
            profilePhoto: data.profile_photo || data.profilePhoto,
            isOnline: Boolean(data.is_online ?? data.isOnline),
            currentLocation: data.current_location || data.currentLocation,
            membership: data.membership,
            wallet: data.wallet,
            rating: data.rating || 5.0,
            ratingCount: data.rating_count || data.ratingCount || 0,
            password: data.password,
            createdAt: data.created_at || data.createdAt,
          };
        }
      } catch (err) {
        console.warn('Supabase getPartnerById failed, using fallback:', err);
      }
    }
    return memory.getPartner(id) || null;
  },

  async savePartner(partner: Partner & { password?: string }): Promise<void> {
    memory.savePartner(partner);
    if (supabase) {
      try {
        await supabase.from('partners').upsert({
          id: partner.id,
          firebase_uid: partner.firebaseUid,
          full_name: partner.fullName,
          mobile: partner.mobile,
          email: partner.email,
          service_category: partner.serviceCategory,
          skills: partner.skills,
          service_area: partner.serviceArea,
          district: partner.district,
          address: partner.address,
          id_type: partner.idType,
          id_number: partner.idNumber,
          kyc_status: partner.kycStatus,
          profile_photo: partner.profilePhoto,
          is_online: partner.isOnline,
          current_location: partner.currentLocation,
          membership: partner.membership,
          wallet: partner.wallet,
          rating: partner.rating,
          rating_count: partner.ratingCount,
          password: partner.password,
          created_at: partner.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase savePartner error:', err);
      }
    }
  },

  async updatePartner(id: string, updates: Record<string, any>): Promise<void> {
    memory.updatePartner(id, updates as any);
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
          if (key === 'isOnline') payload.is_online = value;
          else if (key === 'currentLocation') payload.current_location = value;
          else if (key === 'membership') payload.membership = value;
          else if (key === 'wallet') payload.wallet = value;
          else if (key === 'fullName') payload.full_name = value;
          else if (key === 'rating') payload.rating = value;
          else payload[key] = value;
        }
        await supabase.from('partners').update(payload).eq('id', id);
      } catch (err) {
        console.warn('Supabase updatePartner error:', err);
      }
    }
  },

  async getAllBookings(partnerId?: string): Promise<Booking[]> {
    if (supabase) {
      try {
        let query = supabase.from('bookings').select('*');
        if (partnerId) {
          query = query.or(`assigned_partner_id.eq.${partnerId},status.eq.PENDING_ACCEPTANCE`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((b) => ({
            id: b.id,
            customerName: b.customer_name || b.customerName,
            customerPhone: b.customer_phone || b.customerPhone,
            customerLocation: b.customer_location || b.customerLocation,
            serviceName: b.service_name || b.serviceName,
            serviceCategory: b.service_category || b.serviceCategory,
            pricingType: b.pricing_type || b.pricingType || 'HOURLY',
            baseRate: b.base_rate || b.baseRate || 450,
            estimatedDuration: b.estimated_duration || b.estimatedDuration || '60 mins',
            status: b.status,
            assignedPartnerId: b.assigned_partner_id || b.assignedPartnerId,
            dispatchTime: b.dispatch_time || b.dispatchTime || new Date().toISOString(),
            acceptedTime: b.accepted_time || b.acceptedTime,
            arrivedTime: b.arrived_time || b.arrivedTime,
            startTime: b.start_time || b.startTime,
            finishTime: b.finish_time || b.finishTime,
            durationMinutes: b.duration_minutes || b.durationMinutes,
            bill: b.bill,
            payment: b.payment,
            rejectionReason: b.rejection_reason || b.rejectionReason,
            notes: b.notes,
          }));
        }
      } catch (err) {
        console.warn('Supabase getAllBookings error, using local state:', err);
      }
    }
    const all = memory.getBookings();
    if (partnerId) {
      return all.filter((b) => b.assignedPartnerId === partnerId || b.status === 'PENDING_ACCEPTANCE');
    }
    return all;
  },

  async getBookingById(id: string): Promise<Booking | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
        if (!error && data) {
          return {
            id: data.id,
            customerName: data.customer_name || data.customerName,
            customerPhone: data.customer_phone || data.customerPhone,
            customerLocation: data.customer_location || data.customerLocation,
            serviceName: data.service_name || data.serviceName,
            serviceCategory: data.service_category || data.serviceCategory,
            pricingType: data.pricing_type || data.pricingType || 'HOURLY',
            baseRate: data.base_rate || data.baseRate || 450,
            estimatedDuration: data.estimated_duration || data.estimatedDuration || '60 mins',
            status: data.status,
            assignedPartnerId: data.assigned_partner_id || data.assignedPartnerId,
            dispatchTime: data.dispatch_time || data.dispatchTime || new Date().toISOString(),
            acceptedTime: data.accepted_time || data.acceptedTime,
            arrivedTime: data.arrived_time || data.arrivedTime,
            startTime: data.start_time || data.startTime,
            finishTime: data.finish_time || data.finishTime,
            durationMinutes: data.duration_minutes || data.durationMinutes,
            bill: data.bill,
            payment: data.payment,
            rejectionReason: data.rejection_reason || data.rejectionReason,
            notes: data.notes,
          };
        }
      } catch (err) {
        console.warn('Supabase getBookingById error:', err);
      }
    }
    return memory.getBooking(id) || null;
  },

  async saveBooking(booking: Booking): Promise<void> {
    memory.saveBooking(booking);
    if (supabase) {
      try {
        await supabase.from('bookings').upsert({
          id: booking.id,
          customer_name: booking.customerName,
          customer_phone: booking.customerPhone,
          customer_location: booking.customerLocation,
          service_name: booking.serviceName,
          service_category: booking.serviceCategory,
          pricing_type: booking.pricingType,
          base_rate: booking.baseRate,
          estimated_duration: booking.estimatedDuration,
          status: booking.status,
          assigned_partner_id: booking.assignedPartnerId,
          dispatch_time: booking.dispatchTime,
          accepted_time: booking.acceptedTime,
          arrived_time: booking.arrivedTime,
          start_time: booking.startTime,
          finish_time: booking.finishTime,
          duration_minutes: booking.durationMinutes,
          bill: booking.bill,
          payment: booking.payment,
          rejection_reason: booking.rejectionReason,
          notes: booking.notes,
        });
      } catch (err) {
        console.warn('Supabase saveBooking error:', err);
      }
    }
  },

  async updateBooking(id: string, updates: Record<string, any>): Promise<void> {
    memory.updateBooking(id, updates as any);
    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
          if (key === 'assignedPartnerId') payload.assigned_partner_id = value;
          else if (key === 'status') payload.status = value;
          else if (key === 'acceptedTime') payload.accepted_time = value;
          else if (key === 'arrivedTime') payload.arrived_time = value;
          else if (key === 'startTime') payload.start_time = value;
          else if (key === 'finishTime') payload.finish_time = value;
          else if (key === 'durationMinutes') payload.duration_minutes = value;
          else if (key === 'bill') payload.bill = value;
          else if (key === 'payment') payload.payment = value;
          else payload[key] = value;
        }
        await supabase.from('bookings').update(payload).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateBooking error:', err);
      }
    }
  },

  async getNotifications(partnerId: string): Promise<AppNotification[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('partner_id', partnerId)
          .order('timestamp', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((n) => ({
            id: n.id,
            partnerId: n.partner_id || n.partnerId,
            title: n.title,
            message: n.message,
            type: n.type,
            timestamp: n.timestamp || n.time || new Date().toISOString(),
            read: Boolean(n.read),
            bookingId: n.booking_id || n.bookingId,
            actionUrl: n.action_url || n.actionUrl,
          }));
        }
      } catch (err) {
        console.warn('Supabase getNotifications error:', err);
      }
    }
    return memory.getNotifications(partnerId);
  },

  async saveNotification(notification: AppNotification): Promise<void> {
    memory.saveNotification(notification);
    if (supabase) {
      try {
        await supabase.from('notifications').upsert({
          id: notification.id,
          partner_id: notification.partnerId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          timestamp: notification.timestamp,
          read: notification.read,
          booking_id: notification.bookingId,
          action_url: notification.actionUrl,
        });
      } catch (err) {
        console.warn('Supabase saveNotification error:', err);
      }
    }
  },

  async markAllNotificationsRead(partnerId: string): Promise<void> {
    memory.markAllNotificationsRead(partnerId);
    if (supabase) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('partner_id', partnerId);
      } catch (err) {
        console.warn('Supabase markAllNotificationsRead error:', err);
      }
    }
  },
};
