import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase.ts';
import type {
  Partner,
  Booking,
  AppNotification,
  ServiceCategory,
} from '../types/index.ts';
import { doorblyAudio } from '../utils/audio.ts';

interface AppContextType {
  partner: Partner | null;
  activeBooking: Booking | null;
  incomingBooking: Booking | null;
  notifications: AppNotification[];
  unreadNotifCount: number;
  soundEnabled: boolean;
  activeTab: 'dashboard' | 'work' | 'wallet' | 'membership' | 'profile';
  showIncomingModal: boolean;
  showSimulator: boolean;
  showNotifModal: boolean;
  isPhoneFrame: boolean;
  isLoading: boolean;
  error: string | null;
  setActiveTab: (tab: 'dashboard' | 'work' | 'wallet' | 'membership' | 'profile') => void;
  setShowIncomingModal: (show: boolean) => void;
  setShowSimulator: (show: boolean) => void;
  setShowNotifModal: (show: boolean) => void;
  setIsPhoneFrame: (frame: boolean | ((prev: boolean) => boolean)) => void;
  toggleSound: () => void;
  login: (identifier: string, pass?: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  toggleOnline: (status?: boolean) => Promise<boolean>;
  acceptJob: (bookingId: string) => Promise<boolean>;
  rejectJob: (bookingId: string, reason?: string) => Promise<boolean>;
  navigateJob: (bookingId: string) => Promise<boolean>;
  arriveJob: (bookingId: string) => Promise<boolean>;
  startWork: (bookingId: string) => Promise<boolean>;
  finishWork: (bookingId: string, partsAmount?: number, partsNotes?: string) => Promise<boolean>;
  collectPayment: (bookingId: string, method?: 'UPI_QR' | 'CASH', txnRef?: string) => Promise<boolean>;
  payMembership: (method?: string) => Promise<boolean>;
  verifyKYC: (action: 'APPROVE' | 'REJECT') => Promise<boolean>;
  requestPayout: (amount: number, upiId?: string, bankAcc?: string) => Promise<boolean>;
  dispatchSimulation: (customData?: any) => Promise<{ success: boolean; message: string }>;
  markNotificationsRead: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [incomingBooking, setIncomingBooking] = useState<Booking | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'work' | 'wallet' | 'membership' | 'profile'>('dashboard');
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing real partner session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedPartnerId = localStorage.getItem('doorbly_partner_id');
        if (savedPartnerId) {
          const res = await fetch(`/api/auth/me/${savedPartnerId}`);
          if (res.ok) {
            const data = await res.json();
            setPartner(data.partner);
          } else {
            localStorage.removeItem('doorbly_partner_id');
          }
        }
      } catch (err) {
        console.error('Failed to restore partner session', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Fetch active work and notifications when partner changes
  const refreshData = useCallback(async () => {
    if (!partner) return;
    try {
      // 1. Fetch partner profile & membership
      const pRes = await fetch(`/api/auth/me/${partner.id}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPartner(pData.partner);
      }

      // 2. Fetch active and incoming work
      const wRes = await fetch(`/api/partner/${partner.id}/active-work`);
      if (wRes.ok) {
        const wData = await wRes.json();
        setActiveBooking(wData.activeBooking);
        setIncomingBooking(wData.pendingAcceptanceBooking);
        if (wData.pendingAcceptanceBooking) {
          setShowIncomingModal(true);
          doorblyAudio.playIncomingAlert();
        }
      }

      // 3. Fetch notifications
      const nRes = await fetch(`/api/notifications/${partner.id}`);
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData.notifications);
      }
    } catch (err) {
      console.error('Error refreshing partner data', err);
    }
  }, [partner?.id]);

  useEffect(() => {
    if (partner) {
      refreshData();
    }
  }, [partner?.id, refreshData]);

  // Connect Server-Sent Events (SSE) for real-time dispatch alerts
  useEffect(() => {
    if (!partner) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/partner/events/${partner.id}`);

      eventSource.addEventListener('new_job', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setIncomingBooking(payload.booking);
          setShowIncomingModal(true);
          doorblyAudio.playIncomingAlert();

          if (payload.notification) {
            setNotifications((prev) => [payload.notification, ...prev]);
          }
        } catch (err) {
          console.error('Error parsing SSE new_job', err);
        }
      });

      eventSource.addEventListener('notification', (e: MessageEvent) => {
        try {
          const notif = JSON.parse(e.data);
          setNotifications((prev) => [notif, ...prev]);
        } catch (err) {
          console.error('Error parsing SSE notification', err);
        }
      });

      eventSource.addEventListener('job_accepted', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setActiveBooking(payload.booking);
          setIncomingBooking(null);
          setShowIncomingModal(false);
          doorblyAudio.playAcceptChime();
        } catch (err) {
          console.error(err);
        }
      });

      eventSource.addEventListener('job_completed', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          doorblyAudio.playPaymentSuccessChime();
          if (payload.wallet && partner) {
            setPartner((prev) => (prev ? { ...prev, wallet: payload.wallet } : null));
          }
        } catch (err) {
          console.error(err);
        }
      });
    } catch (err) {
      console.error('SSE connection failed', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [partner?.id]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    doorblyAudio.setSoundEnabled(next);
  };

  const login = async (identifier: string, pass?: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    doorblyAudio.playClickSound();
    try {
      // If logging in via email, authenticate with Firebase Auth
      if (identifier.includes('@') && pass) {
        try {
          await signInWithEmailAndPassword(auth, identifier.trim().toLowerCase(), pass);
        } catch (authErr: any) {
          if (authErr?.code === 'auth/wrong-password' || authErr?.code === 'auth/invalid-credential') {
            setError('Incorrect email or password entered.');
            return false;
          }
        }
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass || '' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return false;
      }
      setPartner(data.partner);
      if (data.partner?.id) {
        localStorage.setItem('doorbly_partner_id', data.partner.id);
      }
      setActiveTab('dashboard');
      return true;
    } catch (err) {
      setError('Connection error to Doorbly Partner server.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: any): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    doorblyAudio.playClickSound();
    try {
      let firebaseUid = '';
      if (formData.email && formData.password) {
        try {
          const userCred = await createUserWithEmailAndPassword(
            auth,
            formData.email.trim().toLowerCase(),
            formData.password
          );
          firebaseUid = userCred.user.uid;
        } catch (authErr: any) {
          if (authErr?.code === 'auth/email-already-in-use') {
            setError('An account with this email address already exists in Firebase.');
            return false;
          }
          console.warn('Firebase Auth note:', authErr?.message || authErr);
        }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, firebaseUid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return false;
      }
      setPartner(data.partner);
      if (data.partner?.id) {
        localStorage.setItem('doorbly_partner_id', data.partner.id);
      }
      setActiveTab('membership');
      return true;
    } catch (err) {
      setError('Connection error while registering.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    doorblyAudio.stopIncomingAlert();
    doorblyAudio.playClickSound();
    signOut(auth).catch(() => {});
    localStorage.removeItem('doorbly_partner_id');
    setPartner(null);
    setActiveBooking(null);
    setIncomingBooking(null);
    setActiveTab('dashboard');
  };

  // Toggle Online/Offline
  const toggleOnline = async (targetStatus?: boolean): Promise<boolean> => {
    if (!partner) return false;
    const nextStatus = targetStatus !== undefined ? targetStatus : !partner.isOnline;
    doorblyAudio.playClickSound();

    try {
      let currentCoords = {
        lat: partner.currentLocation.lat,
        lng: partner.currentLocation.lng,
      };

      // Try browser geolocation if turning online
      if (nextStatus && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          // fallback to partner base
        }
      }

      const res = await fetch('/api/partner/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          isOnline: nextStatus,
          location: currentCoords,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not update status');
        if (data.error && data.error.includes('membership')) {
          setActiveTab('membership');
        }
        return false;
      }

      setPartner(data.partner);
      return true;
    } catch (err) {
      setError('Status update network error');
      return false;
    }
  };

  // Accept incoming job
  const acceptJob = async (bookingId: string): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.stopIncomingAlert();
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveBooking(data.booking);
        setIncomingBooking(null);
        setShowIncomingModal(false);
        setActiveTab('work');
        doorblyAudio.playAcceptChime();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Reject incoming job
  const rejectJob = async (bookingId: string, reason = 'Too far from location'): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.stopIncomingAlert();
    doorblyAudio.playClickSound();
    try {
      await fetch(`/api/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id, reason }),
      });
      setIncomingBooking(null);
      setShowIncomingModal(false);
      return true;
    } catch {
      return false;
    }
  };

  // Navigate to location
  const navigateJob = async (bookingId: string): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.playClickSound();
    try {
      const res = await fetch(`/api/bookings/${bookingId}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveBooking(data.booking);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Arrive at location
  const arriveJob = async (bookingId: string): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.playClickSound();
    try {
      const res = await fetch(`/api/bookings/${bookingId}/arrive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveBooking(data.booking);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Start work (begins timer)
  const startWork = async (bookingId: string): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.playStartWorkChime();
    try {
      const res = await fetch(`/api/bookings/${bookingId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveBooking(data.booking);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Finish work (calculates final amount)
  const finishWork = async (
    bookingId: string,
    partsAmount = 0,
    partsNotes = ''
  ): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.playClickSound();
    try {
      const res = await fetch(`/api/bookings/${bookingId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          materialPartsAmount: partsAmount,
          materialNotes: partsNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveBooking(data.booking);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Collect Payment & Complete
  const collectPayment = async (
    bookingId: string,
    method: 'UPI_QR' | 'CASH' = 'UPI_QR',
    txnRef = ''
  ): Promise<boolean> => {
    if (!partner) return false;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id, paymentMethod: method, transactionRef: txnRef }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveBooking(data.booking);
        setPartner((prev) => (prev ? { ...prev, wallet: data.wallet } : null));
        doorblyAudio.playPaymentSuccessChime();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Pay ₹370 Monthly Membership
  const payMembership = async (method = 'UPI'): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.playClickSound();
    try {
      const res = await fetch('/api/membership/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id, paymentMethod: method }),
      });
      const data = await res.json();
      if (res.ok) {
        setPartner(data.partner);
        doorblyAudio.playPaymentSuccessChime();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Verify KYC (Admin / Demo review toggle)
  const verifyKYC = async (action: 'APPROVE' | 'REJECT'): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.playClickSound();
    try {
      const res = await fetch('/api/partner/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setPartner(data.partner);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Request Payout / Withdrawal
  const requestPayout = async (amount: number, upiId?: string, bankAcc?: string): Promise<boolean> => {
    if (!partner) return false;
    doorblyAudio.playClickSound();
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id, amount, upiId, bankAccountNumber: bankAcc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Payout request failed');
        return false;
      }
      setPartner((prev) => (prev ? { ...prev, wallet: data.wallet } : null));
      doorblyAudio.playPaymentSuccessChime();
      return true;
    } catch {
      setError('Network error requesting withdrawal');
      return false;
    }
  };

  // Trigger customer booking dispatch simulation
  const dispatchSimulation = async (customData?: any): Promise<{ success: boolean; message: string }> => {
    if (!partner) return { success: false, message: 'No partner logged in' };

    const payload = customData || {
      customerName: 'Kavita Sundaram',
      customerPhone: '+91 98450 77123',
      customerLocation: {
        address: 'Villa 14, Rainbow Drive, Sarjapur Rd',
        landmark: 'Behind Decathlon',
        lat: partner.currentLocation.lat + 0.012,
        lng: partner.currentLocation.lng + 0.008,
      },
      serviceName:
        partner.serviceCategory === 'Electrician'
          ? 'Emergency Main Switchboard Sparking & Inverter Repair'
          : `${partner.serviceCategory} Urgent Inspection & Service`,
      serviceCategory: partner.serviceCategory,
      pricingType: 'HOURLY',
      baseRate: 450,
      estimatedDuration: '60 mins',
      forcedPartnerId: partner.id, // For simulation testing
    };

    try {
      const res = await fetch('/api/bookings/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Dispatch matching failed' };
      }

      setIncomingBooking(data.booking);
      setShowIncomingModal(true);
      doorblyAudio.playIncomingAlert();
      return { success: true, message: 'Work request dispatched! Check incoming work alert.' };
    } catch {
      return { success: false, message: 'Network error calling dispatch engine' };
    }
  };

  const markNotificationsRead = async () => {
    if (!partner) return;
    try {
      await fetch(`/api/notifications/${partner.id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        partner,
        activeBooking,
        incomingBooking,
        notifications,
        unreadNotifCount,
        soundEnabled,
        activeTab,
        showIncomingModal,
        showSimulator,
        showNotifModal,
        isPhoneFrame,
        isLoading,
        error,
        setActiveTab,
        setShowIncomingModal,
        setShowSimulator,
        setShowNotifModal,
        setIsPhoneFrame,
        toggleSound,
        login,
        register,
        logout,
        toggleOnline,
        acceptJob,
        rejectJob,
        navigateJob,
        arriveJob,
        startWork,
        finishWork,
        collectPayment,
        payMembership,
        verifyKYC,
        requestPayout,
        dispatchSimulation,
        markNotificationsRead,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
