import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { AndroidFrame } from './components/AndroidFrame.tsx';
import { TopBar } from './components/TopBar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ActiveWorkView } from './components/ActiveWorkView.tsx';
import { WalletView } from './components/WalletView.tsx';
import { MembershipView } from './components/MembershipView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { IncomingJobModal } from './components/IncomingJobModal.tsx';
import { CustomerSimulatorModal } from './components/CustomerSimulatorModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';

function MainAppContent() {
  const { partner, activeTab, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Loading Doorbly Partner App...</span>
      </div>
    );
  }

  // If partner is not logged in, render Auth modal
  if (!partner) {
    return <AuthModal />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'work':
        return <ActiveWorkView />;
      case 'wallet':
        return <WalletView />;
      case 'membership':
        return <MembershipView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AndroidFrame>
      <TopBar />
      <div className="flex-1">{renderActiveTab()}</div>
      <BottomNav />

      {/* Global Interactive Overlays */}
      <IncomingJobModal />
      <CustomerSimulatorModal />
      <NotificationsModal />
    </AndroidFrame>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
