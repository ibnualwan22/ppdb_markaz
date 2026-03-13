"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { PusherProvider } from "../providers/PusherProvider";

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

const menuItems = [
  { href: "/admin/", label: "Halaman Utama", icon: <IconChart /> },
  { href: "/admin/dashboard", label: "Dashboard Muasis", icon: <IconHome /> },
  { href: "/admin/asrama", label: "Meja Asrama", icon: <IconBed /> },
  { href: "/admin/id-card", label: "Meja ID Card", icon: <IconIdCard /> },
];

const masterItems = [
  { href: "/admin/master", label: "Master Lokasi", icon: <IconCog /> },
  { href: "/admin/dufah", label: "Manajemen Duf'ah", icon: <IconCalendar /> },
  { href: "/admin/santri", label: "Master Santri", icon: <IconGradCap /> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin/") return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive(href)
        ? "bg-white/20 text-white shadow-lg shadow-blue-900/20 backdrop-blur-sm"
        : "text-blue-100 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <PusherProvider>
    <div className="flex h-screen bg-[#f0f4ff]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 text-center border-b border-blue-700/50">
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-lg overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain"
              onError={(e) => {
                // Fallback: hide broken image and show text
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = '<span style="font-size:14px;font-weight:700;color:white;">MA</span>';
                }
              }}
            />
          </div>
          <h2 className="text-lg font-bold tracking-wide">PPDB Markaz Arabiyyah</h2>
          <p className="text-xs text-blue-300 mt-1 font-medium">Portal Administrasi</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 mb-2">Menu Utama</p>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-blue-700/50">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-3 mb-2">Pengaturan</p>
            {masterItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="w-5 h-5 flex items-center justify-center shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-700/50 text-center">
          <p className="text-[10px] text-blue-400 font-medium">© 2025 Markaz Arabiyyah</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar (Mobile) */}
        <header className="md:hidden bg-white border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-blue-50 transition text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-blue-900">PPDB Markaz</h1>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
    </PusherProvider>
  );
}