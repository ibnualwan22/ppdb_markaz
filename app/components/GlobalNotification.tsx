"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePusher } from "../providers/PusherProvider";
import Link from "next/link";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  link: string | null;
  permissionRequired: string;
  createdAt: string;
}

export default function GlobalNotification() {
  const { data: session } = useSession();
  const pusherClient = usePusher();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundType, setSoundType] = useState("bell");
  const [activeToast, setActiveToast] = useState<NotificationData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("notifSound");
    if (saved) setSoundType(saved);
  }, []);

  const playNotificationSound = (type = soundType) => {
    if (type === "mute") return;
    try {
      if (type === "mixkit") {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
        audio.play().catch(() => {});
        return;
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      if (type === "pop") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "chime") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        // default: bell
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.05); // A6
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.log("Audio not supported or blocked", e);
    }
  };

  const userPermissions = (session?.user as any)?.permissions || [];

  const fetchNotifications = async () => {
    if (userPermissions.length === 0) return;
    try {
      const perms = userPermissions.join(",");
      const res = await fetch(`/api/notifications?permissions=${perms}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  useEffect(() => {
    if (pusherClient && session) {
      const channel = pusherClient.subscribe("channel-markaz");
      
      channel.bind("new-notif", (data: NotificationData) => {
        if (userPermissions.includes("all_access") || userPermissions.includes(data.permissionRequired)) {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
          playNotificationSound();

          // Show Toast Popup
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          setActiveToast(data);
          toastTimeoutRef.current = setTimeout(() => {
            setActiveToast(null);
          }, 6000);
        }
      });

      return () => {
        pusherClient.unsubscribe("channel-markaz");
      };
    }
  }, [pusherClient, session]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Reset badge when opened
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={toggleDropdown}
          className="relative p-2 rounded-xl text-gray-400 hover:text-gold-400 hover:bg-gold-500/10 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-dark-800 border border-gold-500/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-5">
            <div className="p-3 border-b border-gold-500/10 flex justify-between items-center bg-dark-900/50">
              <h3 className="text-sm font-bold text-gold-500">Notifikasi</h3>
              <div className="flex items-center gap-2">
                <select 
                  value={soundType}
                  onChange={(e) => {
                    setSoundType(e.target.value);
                    localStorage.setItem("notifSound", e.target.value);
                    playNotificationSound(e.target.value);
                  }}
                  className="bg-dark-800 text-[10px] font-bold text-gray-400 border border-gold-500/20 rounded px-1.5 py-1 outline-none cursor-pointer hover:border-gold-500/50 transition-colors"
                  title="Ganti Suara Notifikasi"
                >
                  <option value="bell">Suara: Bell</option>
                  <option value="pop">Suara: Pop</option>
                  <option value="chime">Suara: Chime</option>
                  <option value="mixkit">Suara: Digital Pop</option>
                  <option value="mute">Mute (Senyap)</option>
                </select>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Tidak ada notifikasi baru
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gold-500/5">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-white/5 transition group">
                      {notif.link ? (
                        <Link href={notif.link} className="block" onClick={() => setIsOpen(false)}>
                          <h4 className="text-xs font-bold text-gray-200 group-hover:text-gold-400 transition">{notif.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-1 leading-snug">{notif.message}</p>
                          <span className="text-[9px] text-gray-500 mt-2 block">
                            {new Date(notif.createdAt).toLocaleString('id-ID')}
                          </span>
                        </Link>
                      ) : (
                        <div>
                          <h4 className="text-xs font-bold text-gray-200 group-hover:text-gold-400 transition">{notif.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-1 leading-snug">{notif.message}</p>
                          <span className="text-[9px] text-gray-500 mt-2 block">
                            {new Date(notif.createdAt).toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Global Toast Popup */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-[100] animate-in slide-in-from-right-full duration-500">
          <div className="bg-dark-800 border-l-4 border-gold-500 shadow-2xl rounded-xl p-4 flex items-center gap-4 min-w-[320px] max-w-[400px] border-y border-r border-gold-500/20 backdrop-blur-md">
            <div className="bg-gold-500/10 p-2.5 rounded-full text-gold-500 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gold-400 text-sm leading-tight">{activeToast.title}</h4>
              <p className="text-gray-300 text-[11px] mt-1.5 leading-relaxed font-medium line-clamp-2">{activeToast.message}</p>
              {activeToast.link && (
                <Link 
                  href={activeToast.link} 
                  onClick={() => setActiveToast(null)}
                  className="inline-block mt-2 text-[10px] text-gold-500 hover:text-gold-400 font-bold underline decoration-gold-500/30 underline-offset-2"
                >
                  Lihat Detail &rarr;
                </Link>
              )}
            </div>
            <button 
              onClick={() => setActiveToast(null)}
              className="text-gray-500 hover:text-white p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
