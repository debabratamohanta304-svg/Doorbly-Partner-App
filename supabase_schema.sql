-- ============================================================================
-- DOORBLY PARTNER APP - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ============================================================================

-- 1. Create PARTNERS Table
CREATE TABLE IF NOT EXISTS public.partners (
    id TEXT PRIMARY KEY,
    firebase_uid TEXT,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    service_category TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    service_area TEXT,
    district TEXT,
    address TEXT,
    id_type TEXT,
    id_number TEXT,
    kyc_status TEXT DEFAULT 'PENDING',
    profile_photo TEXT,
    is_online BOOLEAN DEFAULT false,
    current_location JSONB,
    membership JSONB,
    wallet JSONB,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    rating_count INTEGER DEFAULT 0,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create BOOKINGS Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    booking_number TEXT NOT NULL,
    service_category TEXT NOT NULL,
    service_title TEXT NOT NULL,
    customer JSONB NOT NULL,
    location JSONB NOT NULL,
    schedule JSONB NOT NULL,
    pricing JSONB NOT NULL,
    status TEXT NOT NULL,
    assigned_partner_id TEXT REFERENCES public.partners(id) ON DELETE SET NULL,
    timeline JSONB[] DEFAULT '{}',
    payment JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    partner_id TEXT REFERENCES public.partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    time TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_partners_mobile ON public.partners(mobile);
CREATE INDEX IF NOT EXISTS idx_partners_email ON public.partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_service_category ON public.partners(service_category);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_partner ON public.bookings(assigned_partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_partner_id ON public.notifications(partner_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. Default Access Policies
CREATE POLICY "Public Read Access" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.partners FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON public.partners FOR UPDATE USING (true);

CREATE POLICY "Public Read Bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public Insert Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Bookings" ON public.bookings FOR UPDATE USING (true);

CREATE POLICY "Public Notifications" ON public.notifications FOR ALL USING (true);
