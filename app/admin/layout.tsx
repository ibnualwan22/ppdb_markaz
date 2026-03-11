import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-center border-b border-green-800">
          <h2 className="text-2xl font-bold tracking-wider">PPDB Pusat</h2>
          <p className="text-sm text-green-300 mt-1">Portal Admin</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin/dashboard" className="block p-3 rounded-lg hover:bg-green-800 transition">
            📊 Dashboard Muasis
          </Link>
          <Link href="/admin/asrama" className="block p-3 rounded-lg hover:bg-green-800 transition">
            🏠 Meja Asrama
          </Link>
          <Link href="/admin/id-card" className="block p-3 rounded-lg hover:bg-green-800 transition">
            🪪 Meja ID Card
          </Link>
          <div className="pt-4 mt-4 border-t border-green-800">
            <Link href="/admin/master" className="block p-3 rounded-lg hover:bg-green-800 transition text-yellow-400">
              ⚙️ Master Lokasi
            </Link>
            <Link href="/admin/dufah" className="block p-3 rounded-lg hover:bg-green-800 transition text-white">
  🗓️ Manajemen Duf'ah
</Link>
<Link href="/admin/santri" className="block p-3 rounded-lg hover:bg-green-800 transition text-blue-300 mt-2">
              🎓 Master Santri
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}