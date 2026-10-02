export type ServiceCategory =
  | 'Electrician'
  | 'Plumbing'
  | 'AC & Appliance Repair'
  | 'Carpentry'
  | 'Home Cleaning'
  | 'Painting';

export type KYCStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING_PAYMENT';

export type JobStatus =
  | 'PENDING_ACCEPTANCE'
  | 'ASSIGNED'
  | 'NAVIGATING'
  | 'ARRIVED'
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'REJECTED';

export interface PartnerLocation {
  lat: number;
  lng: number;
  address: string;
  district: string;
  lastUpdated: string;
}

export interface PartnerMembership {
  plan: string;
  monthlyFee: number;
  status: MembershipStatus;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  paymentStatus: 'PAID' | 'DUE';
  autoRenew: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'EARNING' | 'MEMBERSHIP' | 'WITHDRAWAL';
  amount: number;
  description: string;
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  bookingId?: string;
  payoutRef?: string;
}

export interface PartnerWallet {
  availableBalance: number;
  todayEarnings: number;
  totalEarnings: number;
  todayCompletedJobs: number;
  totalCompletedJobs: number;
  pendingWithdrawals: number;
  transactions: WalletTransaction[];
}

export interface Partner {
  id: string;
  firebaseUid?: string;
  fullName: string;
  mobile: string;
  email: string;
  serviceCategory: ServiceCategory;
  skills: string[];
  serviceArea: string;
  district: string;
  address: string;
  idType: 'Aadhaar Card' | 'PAN Card' | 'Voter ID';
  idNumber: string;
  kycStatus: KYCStatus;
  profilePhoto: string;
  isOnline: boolean;
  currentLocation: PartnerLocation;
  membership: PartnerMembership;
  wallet: PartnerWallet;
  rating: number;
  ratingCount: number;
  createdAt: string;
}

export interface BillBreakdown {
  serviceAmount: number;
  hourlyRate?: number;
  hoursCalculated?: number;
  materialPartsAmount: number;
  materialNotes?: string;
  platformFee: number;
  taxes: number;
  finalAmountPayable: number;
  partnerShare: number;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerLocation: {
    address: string;
    landmark?: string;
    lat: number;
    lng: number;
    distanceKm: number;
  };
  serviceName: string;
  serviceCategory: ServiceCategory;
  pricingType: 'HOURLY' | 'FIXED';
  baseRate: number;
  estimatedDuration: string;
  status: JobStatus;
  assignedPartnerId?: string;
  dispatchTime: string;
  acceptedTime?: string;
  arrivedTime?: string;
  startTime?: string;
  finishTime?: string;
  durationMinutes?: number;
  bill?: BillBreakdown;
  payment?: {
    status: 'PENDING' | 'COLLECTED';
    method: 'UPI_QR' | 'CASH';
    collectedAt?: string;
    transactionRef?: string;
  };
  rejectionReason?: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  partnerId?: string;
  title: string;
  message: string;
  type: 'NEW_JOB' | 'BOOKING_UPDATE' | 'MEMBERSHIP' | 'PAYMENT' | 'ANNOUNCEMENT';
  timestamp: string;
  read: boolean;
  bookingId?: string;
  actionUrl?: string;
}
