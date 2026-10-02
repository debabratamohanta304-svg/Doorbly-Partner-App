import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { supabaseStorage } from './src/lib/supabase.ts';
import type {
  Partner,
  Booking,
  AppNotification,
  ServiceCategory,
  WalletTransaction,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// SSE client connections map: partnerId -> Response[] for real-time dispatch alerts
const sseClients: Map<string, Response[]> = new Map();

function sendSSEEvent(partnerId: string, eventType: string, data: any) {
  const clients = sseClients.get(partnerId) || [];
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => {
    try {
      res.write(message);
    } catch {
      // client disconnected
    }
  });
}

// Distance calculation helper (Haversine formula)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// -------------------------------------------------------------
// Supabase Data Storage Endpoints (Firebase used for Auth only)
// -------------------------------------------------------------

// SSE stream for real-time alerts
app.get('/api/partner/events/:partnerId', (req: Request, res: Response) => {
  const { partnerId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const existingClients = sseClients.get(partnerId) || [];
  sseClients.set(partnerId, [...existingClients, res]);

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', partnerId })}\n\n`);

  req.on('close', () => {
    const clients = sseClients.get(partnerId) || [];
    sseClients.set(
      partnerId,
      clients.filter((c) => c !== res)
    );
  });
});

// Partner Auth: Login with credentials verified against Supabase database
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your mobile/email and password.' });
  }

  try {
    const cleanId = identifier.trim();
    const partnersList = await supabaseStorage.getAllPartners();

    const matchedPartner = partnersList.find((p) => {
      const mobMatch = p.mobile && p.mobile.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '');
      const emailMatch = p.email && p.email.toLowerCase() === cleanId.toLowerCase();
      const idMatch = p.id && p.id.toLowerCase() === cleanId.toLowerCase();
      return Boolean(mobMatch || emailMatch || idMatch);
    });

    if (!matchedPartner) {
      return res.status(401).json({
        error: 'Partner account not found. Please register your account.',
      });
    }

    if (matchedPartner.password && matchedPartner.password !== password) {
      return res.status(401).json({ error: 'Incorrect password entered.' });
    }

    // Verify membership status from backend
    const now = new Date();
    const expiry = new Date(matchedPartner.membership.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    matchedPartner.membership.daysRemaining = Math.max(0, diffDays);
    if (diffDays <= 0 && matchedPartner.membership.status === 'ACTIVE') {
      matchedPartner.membership.status = 'EXPIRED';
      await supabaseStorage.updatePartner(matchedPartner.id, {
        membership: {
          ...matchedPartner.membership,
          status: 'EXPIRED',
          daysRemaining: 0,
        },
      });
    }

    // Strip password before returning
    const { password: _, ...safePartner } = matchedPartner;
    res.json({ partner: safePartner });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Database error verifying credentials.' });
  }
});

// Partner Auth: Register new partner in Supabase data storage
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const {
    fullName,
    mobile,
    email,
    serviceCategory,
    skills,
    serviceArea,
    district,
    address,
    idType,
    idNumber,
    password,
    firebaseUid = '',
  } = req.body;

  if (!fullName || !mobile || !email || !serviceCategory || !password) {
    return res.status(400).json({ error: 'Please provide all required registration fields.' });
  }

  try {
    const existingList = await supabaseStorage.getAllPartners();
    const duplicate = existingList.some(
      (p) =>
        (p.mobile && p.mobile.replace(/\s+/g, '') === mobile.replace(/\s+/g, '')) ||
        (p.email && p.email.toLowerCase() === email.toLowerCase())
    );

    if (duplicate) {
      return res.status(400).json({ error: 'An account with this mobile or email already exists.' });
    }

    const newPartnerId = `DBY-PRT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPartner: Partner & { password?: string } = {
      id: newPartnerId,
      firebaseUid,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      serviceCategory: serviceCategory as ServiceCategory,
      skills: skills && skills.length > 0 ? skills : [`Standard ${serviceCategory} Solutions`],
      serviceArea: serviceArea || 'Central District',
      district: district || 'Local District',
      address: address || '',
      idType: idType || 'Aadhaar Card',
      idNumber: idNumber || '',
      kycStatus: 'PENDING',
      profilePhoto: '/src/assets/images/partner_avatar_1790879508326.jpg',
      isOnline: false,
      currentLocation: {
        lat: 12.9716,
        lng: 77.6412,
        address: address || 'Service Base',
        district: district || 'Local District',
        lastUpdated: new Date().toISOString(),
      },
      membership: {
        plan: 'Doorbly Pro Partner Membership',
        monthlyFee: 370,
        status: 'PENDING_PAYMENT',
        startDate: new Date().toISOString(),
        expiryDate: new Date().toISOString(),
        daysRemaining: 0,
        paymentStatus: 'DUE',
        autoRenew: true,
      },
      wallet: {
        availableBalance: 0,
        todayEarnings: 0,
        totalEarnings: 0,
        todayCompletedJobs: 0,
        totalCompletedJobs: 0,
        pendingWithdrawals: 0,
        transactions: [],
      },
      rating: 5.0,
      ratingCount: 0,
      password,
      createdAt: new Date().toISOString(),
    };

    // Store in Supabase
    await supabaseStorage.savePartner(newPartner);

    // Initial notification in Supabase
    const notifId = `NOTIF-${Date.now()}`;
    const initialNotif: AppNotification = {
      id: notifId,
      partnerId: newPartnerId,
      title: 'Registration Submitted',
      message: 'Account created! Activate your ₹370/month membership to start receiving service requests.',
      type: 'ANNOUNCEMENT',
      timestamp: new Date().toISOString(),
      read: false,
    };
    await supabaseStorage.saveNotification(initialNotif);

    const { password: _, ...safePartner } = newPartner;
    res.status(201).json({ partner: safePartner });
  } catch (error: any) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Failed to save registration in database.' });
  }
});

// Partner Auth: Fetch current partner from Supabase
app.get('/api/auth/me/:id', async (req: Request, res: Response) => {
  try {
    const partner = await supabaseStorage.getPartnerById(req.params.id);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    // Recalculate membership days remaining
    const now = new Date();
    const expiry = new Date(partner.membership.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    partner.membership.daysRemaining = Math.max(0, diffDays);

    if (diffDays <= 0 && partner.membership.status === 'ACTIVE') {
      partner.membership.status = 'EXPIRED';
      await supabaseStorage.updatePartner(partner.id, {
        membership: {
          ...partner.membership,
          status: 'EXPIRED',
          daysRemaining: 0,
        },
      });
    }

    const { password: _, ...safePartner } = partner;
    res.json({ partner: safePartner });
  } catch (error: any) {
    res.status(500).json({ error: 'Database read error.' });
  }
});

// Update Partner Online/Offline Status & Coordinates in Supabase
app.post('/api/partner/status', async (req: Request, res: Response) => {
  const { partnerId, isOnline, location } = req.body;
  try {
    const partner = await supabaseStorage.getPartnerById(partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    // Membership verification before turning online
    if (isOnline && partner.membership.status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Cannot go online. Active ₹370/month membership is required to receive customer work.',
      });
    }

    const updatePayload: any = {
      isOnline: Boolean(isOnline),
    };

    if (location) {
      updatePayload.currentLocation = {
        lat: location.lat || partner.currentLocation.lat,
        lng: location.lng || partner.currentLocation.lng,
        address: location.address || partner.currentLocation.address,
        district: location.district || partner.currentLocation.district,
        lastUpdated: new Date().toISOString(),
      };
    }

    await supabaseStorage.updatePartner(partnerId, updatePayload);
    const updated = await supabaseStorage.getPartnerById(partnerId);
    res.json({ partner: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update partner status in database.' });
  }
});

// Partner Membership: Subscribe or Renew (₹370/month) stored in Supabase
app.post('/api/membership/pay', async (req: Request, res: Response) => {
  const { partnerId, paymentMethod = 'UPI' } = req.body;
  try {
    const partner = await supabaseStorage.getPartnerById(partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newMembership = {
      plan: 'Doorbly Pro Partner Membership',
      monthlyFee: 370,
      status: 'ACTIVE' as const,
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      daysRemaining: 30,
      paymentStatus: 'PAID' as const,
      autoRenew: true,
    };

    const txn: WalletTransaction = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'MEMBERSHIP',
      amount: -370,
      description: `Monthly Doorbly Partner Subscription (Paid via ${paymentMethod})`,
      timestamp: now.toISOString(),
      status: 'SUCCESS',
    };

    const transactions = [txn, ...(partner.wallet.transactions || [])];

    await supabaseStorage.updatePartner(partnerId, {
      membership: newMembership,
      wallet: {
        ...partner.wallet,
        transactions,
      },
    });

    const notifId = `NOTIF-${Date.now()}`;
    const notif: AppNotification = {
      id: notifId,
      partnerId,
      title: 'Membership Activated',
      message: '₹370 subscription payment confirmed! Active for 30 days. You are ready to go online.',
      type: 'MEMBERSHIP',
      timestamp: now.toISOString(),
      read: false,
    };
    await supabaseStorage.saveNotification(notif);

    sendSSEEvent(partnerId, 'notification', notif);

    const updated = await supabaseStorage.getPartnerById(partnerId);
    res.json({ partner: updated, transaction: txn });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record membership payment.' });
  }
});

// Partner KYC Verification update in Supabase
app.post('/api/partner/kyc/verify', async (req: Request, res: Response) => {
  const { partnerId, action } = req.body;
  try {
    const partner = await supabaseStorage.getPartnerById(partnerId);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found.' });
    }

    const kycStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
    await supabaseStorage.updatePartner(partnerId, { kycStatus });

    const notifId = `NOTIF-${Date.now()}`;
    const notif: AppNotification = {
      id: notifId,
      partnerId,
      title: action === 'APPROVE' ? 'KYC Verified Successfully' : 'KYC Needs Update',
      message:
        action === 'APPROVE'
          ? 'Your identity documents have been approved by Doorbly Operations.'
          : 'Please review and update your identity documents.',
      type: 'ANNOUNCEMENT',
      timestamp: new Date().toISOString(),
      read: false,
    };
    await supabaseStorage.saveNotification(notif);
    sendSSEEvent(partnerId, 'notification', notif);

    const updated = await supabaseStorage.getPartnerById(partnerId);
    res.json({ partner: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Database error updating KYC status.' });
  }
});

// Dispatch / Match Engine: Finds eligible online partner from Supabase & creates booking
app.post('/api/bookings/dispatch', async (req: Request, res: Response) => {
  const {
    customerName,
    customerPhone,
    customerLocation,
    serviceName,
    serviceCategory,
    pricingType = 'HOURLY',
    baseRate = 450,
    estimatedDuration = '60 mins',
    forcedPartnerId,
  } = req.body;

  try {
    let chosenPartner: Partner | null = null;
    let minDistance = Infinity;

    if (forcedPartnerId) {
      chosenPartner = await supabaseStorage.getPartnerById(forcedPartnerId);
    } else {
      const partnersList = await supabaseStorage.getAllPartners();
      const allBookings = await supabaseStorage.getAllBookings();

      // Build active partner ID set
      const busyPartnerIds = new Set<string>();
      allBookings.forEach((b) => {
        if (
          ['PENDING_ACCEPTANCE', 'ASSIGNED', 'NAVIGATING', 'ARRIVED', 'WORK_STARTED', 'WORK_COMPLETED', 'PAYMENT_PENDING'].includes(
            b.status
          ) &&
          b.assignedPartnerId
        ) {
          busyPartnerIds.add(b.assignedPartnerId);
        }
      });

      partnersList.forEach((p) => {
        if (!p.isOnline) return;
        if (p.membership?.status !== 'ACTIVE') return;
        if (p.serviceCategory !== serviceCategory) return;
        if (busyPartnerIds.has(p.id)) return;

        const dist = calculateDistanceKm(
          p.currentLocation.lat,
          p.currentLocation.lng,
          customerLocation.lat,
          customerLocation.lng
        );

        if (dist < minDistance && dist <= 25) {
          minDistance = dist;
          chosenPartner = p;
        }
      });
    }

    if (!chosenPartner) {
      return res.status(404).json({
        error: 'No suitable online partner available with active membership in this category nearby.',
      });
    }

    const distKm =
      minDistance !== Infinity
        ? minDistance
        : calculateDistanceKm(
            chosenPartner.currentLocation.lat,
            chosenPartner.currentLocation.lng,
            customerLocation.lat,
            customerLocation.lng
          );

    const bookingId = `DBY-${Math.floor(60000 + Math.random() * 39999)}`;
    const newBooking: Booking = {
      id: bookingId,
      customerName,
      customerPhone,
      customerLocation: {
        address: customerLocation.address,
        landmark: customerLocation.landmark || '',
        lat: customerLocation.lat,
        lng: customerLocation.lng,
        distanceKm: distKm,
      },
      serviceName,
      serviceCategory,
      pricingType,
      baseRate,
      estimatedDuration,
      status: 'PENDING_ACCEPTANCE',
      assignedPartnerId: chosenPartner.id,
      dispatchTime: new Date().toISOString(),
    };

    // Store booking in Supabase
    await supabaseStorage.saveBooking(newBooking);

    // Store notification in Supabase
    const notifId = `NOTIF-${Date.now()}`;
    const notif: AppNotification = {
      id: notifId,
      partnerId: chosenPartner.id,
      title: 'New Nearby Work Request!',
      message: `${serviceName} (~${distKm} km away) in ${customerLocation.address}`,
      type: 'NEW_JOB',
      timestamp: new Date().toISOString(),
      read: false,
      bookingId,
    };
    await supabaseStorage.saveNotification(notif);

    // Send real-time SSE push
    sendSSEEvent(chosenPartner.id, 'new_job', { booking: newBooking, notification: notif });

    res.status(201).json({
      booking: newBooking,
      matchedPartner: {
        id: chosenPartner.id,
        name: chosenPartner.fullName,
        distanceKm: distKm,
      },
    });
  } catch (error: any) {
    console.error('Error dispatching booking:', error);
    res.status(500).json({ error: 'Failed to process booking dispatch in database.' });
  }
});

// Get Active Work for a partner from Supabase
app.get('/api/partner/:partnerId/active-work', async (req: Request, res: Response) => {
  const { partnerId } = req.params;
  try {
    const allBookings = await supabaseStorage.getAllBookings(partnerId);
    let activeBooking: Booking | null = null;
    let pendingAcceptanceBooking: Booking | null = null;

    allBookings.forEach((b) => {
      if (b.assignedPartnerId === partnerId) {
        if (b.status === 'PENDING_ACCEPTANCE') {
          pendingAcceptanceBooking = b;
        } else if (
          ['ASSIGNED', 'NAVIGATING', 'ARRIVED', 'WORK_STARTED', 'WORK_COMPLETED', 'PAYMENT_PENDING'].includes(
            b.status
          )
        ) {
          activeBooking = b;
        }
      }
    });

    res.json({ activeBooking, pendingAcceptanceBooking });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch active work from database.' });
  }
});

// Partner Work History from Supabase
app.get('/api/partner/:partnerId/history', async (req: Request, res: Response) => {
  const { partnerId } = req.params;
  const filter = (req.query.filter as string) || 'all';

  try {
    const allBookings = await supabaseStorage.getAllBookings(partnerId);
    const partnerBookings: Booking[] = [];
    const now = new Date();

    allBookings.forEach((b) => {
      if (b.assignedPartnerId === partnerId && b.status === 'COMPLETED') {
        const jobDate = new Date(b.finishTime || b.dispatchTime);
        let match = true;
        if (filter === 'today') {
          match = jobDate.toDateString() === now.toDateString();
        } else if (filter === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          match = jobDate >= oneWeekAgo;
        } else if (filter === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          match = jobDate >= oneMonthAgo;
        }
        if (match) {
          partnerBookings.push(b);
        }
      }
    });

    partnerBookings.sort((a, b) => new Date(b.dispatchTime).getTime() - new Date(a.dispatchTime).getTime());
    res.json({ bookings: partnerBookings });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch work history from database.' });
  }
});

// Booking State Transition: Accept in Supabase
app.post('/api/bookings/:id/accept', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partnerId } = req.body;
  try {
    const booking = await supabaseStorage.getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (booking.assignedPartnerId !== partnerId) {
      return res.status(403).json({ error: 'Not assigned to you.' });
    }

    const acceptedTime = new Date().toISOString();
    await supabaseStorage.updateBooking(id, {
      status: 'ASSIGNED',
      acceptedTime,
    });

    const updatedBooking = { ...booking, status: 'ASSIGNED' as const, acceptedTime };
    sendSSEEvent(partnerId, 'job_accepted', { booking: updatedBooking });
    res.json({ booking: updatedBooking });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Booking State Transition: Reject in Supabase
app.post('/api/bookings/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partnerId, reason } = req.body;
  try {
    const booking = await supabaseStorage.getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    await supabaseStorage.updateBooking(id, {
      status: 'REJECTED',
      rejectionReason: reason || 'Declined by partner',
    });

    sendSSEEvent(partnerId, 'job_rejected', { bookingId: id });
    res.json({ message: 'Job rejected.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Booking State Transition: Navigate in Supabase
app.post('/api/bookings/:id/navigate', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const booking = await supabaseStorage.getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    await supabaseStorage.updateBooking(id, { status: 'NAVIGATING' });
    const updated = { ...booking, status: 'NAVIGATING' as const };
    res.json({ booking: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Booking State Transition: Arrive in Supabase
app.post('/api/bookings/:id/arrive', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const booking = await supabaseStorage.getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const arrivedTime = new Date().toISOString();
    await supabaseStorage.updateBooking(id, { status: 'ARRIVED', arrivedTime });
    const updated = { ...booking, status: 'ARRIVED' as const, arrivedTime };
    res.json({ booking: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Booking State Transition: Start Work in Supabase
app.post('/api/bookings/:id/start', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partnerId } = req.body;
  try {
    const booking = await supabaseStorage.getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const startTime = new Date().toISOString();
    await supabaseStorage.updateBooking(id, { status: 'WORK_STARTED', startTime });
    const updated = { ...booking, status: 'WORK_STARTED' as const, startTime };
    sendSSEEvent(partnerId, 'work_started', { booking: updated });
    res.json({ booking: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Booking State Transition: Finish Work in Supabase
app.post('/api/bookings/:id/finish', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partnerId, materialPartsAmount = 0, materialNotes = '' } = req.body;
  try {
    const booking = await supabaseStorage.getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const finishTime = new Date();
    const startTime = booking.startTime ? new Date(booking.startTime) : new Date(Date.now() - 30 * 60 * 1000);
    const durationMs = Math.max(1000 * 60 * 5, finishTime.getTime() - startTime.getTime());
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    let serviceAmount = booking.baseRate;
    let hoursCalculated = 1;

    if (booking.pricingType === 'HOURLY') {
      hoursCalculated = Math.max(1, Math.ceil(durationMinutes / 30) * 0.5);
      serviceAmount = Math.round(booking.baseRate * hoursCalculated);
    }

    const parts = Number(materialPartsAmount) || 0;
    const subtotal = serviceAmount + parts;
    const platformFee = Math.round(subtotal * 0.15);
    const taxes = Math.round(subtotal * 0.05);
    const finalAmountPayable = subtotal + taxes;
    const partnerShare = subtotal - platformFee;

    const bill = {
      serviceAmount,
      hourlyRate: booking.pricingType === 'HOURLY' ? booking.baseRate : undefined,
      hoursCalculated,
      materialPartsAmount: parts,
      materialNotes: materialNotes || '',
      platformFee,
      taxes,
      finalAmountPayable,
      partnerShare,
    };

    await supabaseStorage.updateBooking(id, {
      finishTime: finishTime.toISOString(),
      durationMinutes,
      bill,
      status: 'PAYMENT_PENDING',
    });

    const updated = {
      ...booking,
      finishTime: finishTime.toISOString(),
      durationMinutes,
      bill,
      status: 'PAYMENT_PENDING' as const,
    };

    sendSSEEvent(partnerId, 'work_finished', { booking: updated });
    res.json({ booking: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Booking State Transition: Confirm Payment & Complete in Supabase
app.post('/api/bookings/:id/payment', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partnerId, paymentMethod = 'UPI_QR', transactionRef } = req.body;

  try {
    const [booking, partner] = await Promise.all([
      supabaseStorage.getBookingById(id),
      supabaseStorage.getPartnerById(partnerId),
    ]);

    if (!booking || !partner) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    const now = new Date();
    const payment = {
      status: 'COLLECTED' as const,
      method: paymentMethod as 'UPI_QR' | 'CASH',
      collectedAt: now.toISOString(),
      transactionRef: transactionRef || `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const earnings = booking.bill?.partnerShare || 400;

    const txn: WalletTransaction = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      bookingId: booking.id,
      type: 'EARNING',
      amount: earnings,
      status: 'SUCCESS',
      timestamp: now.toISOString(),
      description: `Payment collected - #${booking.id} (${booking.serviceName})`,
    };

    const updatedWallet = {
      ...partner.wallet,
      availableBalance: (partner.wallet.availableBalance || 0) + earnings,
      todayEarnings: (partner.wallet.todayEarnings || 0) + earnings,
      totalEarnings: (partner.wallet.totalEarnings || 0) + earnings,
      todayCompletedJobs: (partner.wallet.todayCompletedJobs || 0) + 1,
      totalCompletedJobs: (partner.wallet.totalCompletedJobs || 0) + 1,
      transactions: [txn, ...(partner.wallet.transactions || [])],
    };

    await Promise.all([
      supabaseStorage.updateBooking(id, {
        status: 'COMPLETED',
        payment,
      }),
      supabaseStorage.updatePartner(partnerId, { wallet: updatedWallet }),
    ]);

    const updatedBooking = { ...booking, status: 'COMPLETED' as const, payment };
    sendSSEEvent(partnerId, 'job_completed', { booking: updatedBooking, wallet: updatedWallet });

    res.json({ booking: updatedBooking, wallet: updatedWallet });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record payment in database.' });
  }
});

// Partner Wallet: Request Payout / Withdrawal stored in Supabase
app.post('/api/wallet/withdraw', async (req: Request, res: Response) => {
  const { partnerId, amount, upiId, bankAccountNumber } = req.body;
  try {
    const partner = await supabaseStorage.getPartnerById(partnerId);
    if (!partner) return res.status(404).json({ error: 'Partner not found.' });

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid payout amount.' });
    }
    if (withdrawAmount > partner.wallet.availableBalance) {
      return res.status(400).json({ error: 'Requested amount exceeds available balance.' });
    }
    if (withdrawAmount < 200) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹200.' });
    }

    const txn: WalletTransaction = {
      id: `WTH-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'WITHDRAWAL',
      amount: -withdrawAmount,
      description: `Payout transfer to ${upiId || 'Bank Acc ' + bankAccountNumber}`,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      payoutRef: `IMPS-${Math.floor(1000000 + Math.random() * 9000000)}`,
    };

    const updatedWallet = {
      ...partner.wallet,
      availableBalance: partner.wallet.availableBalance - withdrawAmount,
      transactions: [txn, ...(partner.wallet.transactions || [])],
    };

    await supabaseStorage.updatePartner(partnerId, { wallet: updatedWallet });
    res.json({ wallet: updatedWallet, transaction: txn });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// Notifications from Supabase
app.get('/api/notifications/:partnerId', async (req: Request, res: Response) => {
  try {
    const notifs = await supabaseStorage.getNotifications(req.params.partnerId);
    res.json({ notifications: notifs });
  } catch (error: any) {
    res.status(500).json({ error: 'Database read failed.' });
  }
});

app.post('/api/notifications/:partnerId/read', async (req: Request, res: Response) => {
  try {
    await supabaseStorage.markAllNotificationsRead(req.params.partnerId);
    res.json({ message: 'Marked all as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Database update failed.' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving Setup
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Doorbly Partner Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
