"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { PusherProvider } from "../providers/PusherProvider";
import { signOut, useSession } from "next-auth/react";
import GlobalNotification from "../components/GlobalNotification";

// SVG Icon Components
const IconChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zm6-4h2v12H9zm6-6h2v18h-2zm6 10h2v8h-2z" />
  </svg>
);
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
  </svg>
);
const IconBed = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v11a1 1 0 001 1h16a1 1 0 001-1V7M3 7h18M3 7l1.5-4h15L21 7M7 11h10v4H7v-4z" />
  </svg>
);
const IconIdCard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
);
const IconCog = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconGradCap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);
const IconStore = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.965 11.965 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconUserCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconCreditCard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const menuItems = [
  { href: "/admin/", label: "Halaman Utama", icon: <IconChart />, permission: "view_dashboard" },
  { href: "/admin/dashboard", label: "Dashboard Muasis", icon: <IconHome />, permission: "view_dashboard" },
  { href: "/admin/pendaftaran", label: "Meja Keuangan", icon: <IconCreditCard />, permission: "view_keuangan" },
  { href: "/admin/asrama", label: "Meja Asrama", icon: <IconBed />, permission: "view_asrama" },
  { href: "/admin/id-card", label: "Meja ID Card", icon: <IconIdCard />, permission: "view_idcard" },
  { href: "/admin/mimstore", label: "Mims Store", icon: <IconStore />, permission: "view_mimstore" },
];

const masterItems = [
  { href: "/admin/master", label: "Master Lokasi", icon: <IconCog />, permission: "manage_asrama" },
  { href: "/admin/master/program", label: "Master Program", icon: <IconGradCap />, permission: "manage_program" },
  { href: "/admin/dufah", label: "Manajemen Duf'ah", icon: <IconCalendar />, permission: "manage_dufah" },
  { href: "/admin/santri", label: "Master Santri", icon: <IconGradCap />, permission: "view_santri" },
];

const authItems = [
  { href: "/admin/akun", label: "Manajemen Akun", icon: <IconUser />, permission: "manage_users" },
  { href: "/admin/role", label: "Manajemen Role", icon: <IconShield />, permission: "manage_roles" },
  { href: "/admin/activity-log", label: "Log Aktivitas", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, permission: "view_activity_log" },
  { href: "/admin/profil", label: "Profil Saya", icon: <IconUserCircle />, permission: null }, // Semua user punya akses profil
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userPermissions = (session?.user as any)?.permissions || [];
  const hasAccess = (permission?: string | null) => {
    if (!permission) return true; // Tidak butuh permission (misal Profil)
    if (userPermissions.includes("all_access")) return true;
    return userPermissions.includes(permission);
  };

  const isActive = (href: string) => {
    if (href === "/admin/") return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center ${desktopCollapsed ? 'justify-center p-3 md:px-0' : 'gap-3 p-3'} rounded-xl text-sm font-semibold transition-all duration-200 ${isActive(href)
      ? "bg-gold-500/10 text-gold-500 shadow-lg shadow-gold-500/5 backdrop-blur-sm border border-gold-500/20"
      : "text-gray-400 hover:bg-white/5 hover:text-gold-400"
    }`;

  return (
    <PusherProvider>
      <div className="flex h-screen bg-dark-900 bg-luxury-pattern text-foreground">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 ${desktopCollapsed ? 'md:w-20' : 'md:w-72'} w-72 bg-dark-800 border-r border-gold-500/10 flex flex-col shadow-2xl transform transition-all duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          {/* Header */}
          <div className={`p-6 text-center border-b border-gold-500/10 flex flex-col items-center relative transition-all`}>
            <div className={`transition-all duration-300 ${desktopCollapsed ? 'w-10 h-10 mb-0' : 'w-14 h-14 mb-3'} bg-dark-900 border border-gold-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg overflow-hidden`}>
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `<span style="font-size:${desktopCollapsed?'10px':'14px'};font-weight:700;color:white;">MA</span>`;
                  }
                }}
              />
            </div>
            
            <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${desktopCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
              <h2 className="text-lg font-bold tracking-wide text-gold-500 mt-3">PPDB Markaz Arabiyyah</h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">Portal Administrasi</p>
            </div>

            <button 
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-gold-500 text-black rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
              title={desktopCollapsed ? "Perbesar Sidebar" : "Persempit Sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${desktopCollapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${desktopCollapsed ? 'p-2' : 'p-4'} space-y-1.5 overflow-y-auto overflow-x-hidden transition-all custom-scrollbar`}>
            
            {menuItems.some(item => hasAccess(item.permission)) && (
              <>
                <p className={`text-[10px] font-bold text-gold-600/70 uppercase tracking-widest mb-2 transition-all ${desktopCollapsed ? 'px-0 text-center opacity-50 text-[8px] mt-4' : 'px-3 mt-2'}`}>
                  {desktopCollapsed ? '---' : 'Menu Utama'}
                </p>
                {menuItems.filter(item => hasAccess(item.permission)).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass(item.href)}
                    title={desktopCollapsed ? item.label : undefined}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</span>
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${desktopCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>{item.label}</span>
                  </Link>
                ))}
              </>
            )}

            {masterItems.some(item => hasAccess(item.permission)) && (
              <div className={`pt-4 mt-4 border-t border-gold-500/10`}>
                <p className={`text-[10px] font-bold text-gold-600/70 uppercase tracking-widest mb-2 transition-all ${desktopCollapsed ? 'px-0 text-center opacity-50 text-[8px]' : 'px-3'}`}>
                  {desktopCollapsed ? '---' : 'Pengaturan'}
                </p>
                {masterItems.filter(item => hasAccess(item.permission)).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass(item.href)}
                    title={desktopCollapsed ? item.label : undefined}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</span>
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${desktopCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
            
            <div className={`pt-4 mt-4 border-t border-gold-500/10`}>
              <p className={`text-[10px] font-bold text-gold-600/70 uppercase tracking-widest mb-2 transition-all ${desktopCollapsed ? 'px-0 text-center opacity-50 text-[8px]' : 'px-3'}`}>
                {desktopCollapsed ? '---' : 'Security & Akun'}
              </p>
              {authItems.filter(item => hasAccess(item.permission)).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                  title={desktopCollapsed ? item.label : undefined}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</span>
                  <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${desktopCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer (Logout Button) */}
          <div className={`p-4 border-t border-gold-500/10 transition-all ${desktopCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
            <button
              onClick={() => {
                signOut({ callbackUrl: "/login" });
              }}
              title={desktopCollapsed ? "Log Out" : undefined}
              className={`flex items-center ${desktopCollapsed ? 'justify-center p-3' : 'gap-3 p-3 w-full'} rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200`}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                <IconLogout />
              </span>
              <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${desktopCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar (Mobile & Desktop Header) */}
          <header className="bg-dark-800 border-b border-gold-500/10 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-white/5 transition text-gold-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-sm font-bold text-gold-500 md:hidden">PPDB Markaz</h1>
              <h1 className="text-sm font-bold text-gray-400 hidden md:block uppercase tracking-wider">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <GlobalNotification />
              <div className="w-8 md:hidden" />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PusherProvider>
  );
}