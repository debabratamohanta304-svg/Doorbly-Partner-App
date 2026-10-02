import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Wifi,
  Signal,
  Battery,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const { soundEnabled, toggleSound, isPhoneFrame, setIsPhoneFrame, setShowSimulator, partner } = useApp();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-4 text-slate-100 font-sans selection:bg-blue-600">
      {/* Top Desktop Controls Bar (only visible on desktop screens) */}
      <div className="hidden md:flex items-center justify-between w-full max-w-[430px] mb-3 px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Doorbly Partner APK v2.4
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPhoneFrame((prev) => !prev)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isPhoneFrame ? 'Switch to Full Width Mode' : 'Switch to Android Phone Bezel'}
          >
            {isPhoneFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Width</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Bezel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container - Phone Shell on Desktop OR Full-Screen on Mobile / Expanded Mode */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-slate-900 ${
          isPhoneFrame
            ? 'max-w-[420px] h-[100dvh] md:h-[860px] md:max-h-[92vh] md:rounded-[44px] md:border-[10px] md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden'
            : 'max-w-4xl min-h-screen md:min-h-[92vh] md:rounded-2xl border border-slate-800 shadow-2xl'
        }`}
      >
        {/* Android Hardware Front Camera Punch-hole (only in frame mode) */}
        {isPhoneFrame && (
          <div className="hidden md:block absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border border-slate-800 z-50 pointer-events-none shadow-inner" />
        )}

        {/* Android Top System Status Bar */}
        <header className="h-9 shrink-0 px-5 flex items-center justify-between text-xs font-medium text-slate-300 bg-slate-950/70 backdrop-blur-md z-40 select-none border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight tabular-nums text-slate-200">
              {currentTime || '12:00'}
            </span>
            {partner?.isOnline && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSound}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute ringtone sound' : 'Unmute ringtone sound'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <span className="text-[10px] font-bold text-slate-400">5G</span>
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] tabular-nums text-slate-300">92%</span>
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        </header>

        {/* Scrollable App Body Container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-slate-900 pb-20 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {children}
        </main>

        {/* Android Bottom Soft Gesture Pill Bar */}
        <footer className="h-5 shrink-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center pointer-events-none z-50">
          <div className="w-32 h-1 bg-slate-600/60 rounded-full"></div>
        </footer>
      </div>
    </div>
  );
};
