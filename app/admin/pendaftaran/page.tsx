"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Protect } from "@/components/Protect";
import { swalSuccess, swalError } from "@/app/lib/swal";

export default function MejaKeuanganPage() {
  const { data: session } = useSession();
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const muatData = async () => {
    try {
      const res = await fetch("/api/pendaftaran");
      if (res.ok) setTransaksi(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const prosesVerifikasi = async (id: string, isKSU: boolean = false) => {
    if (!confirm(`Yakin ingin memverifikasi transaksi ini${isKSU ? ' sebagai KSU GRATIS' : ''}?`)) return;
    
    setLoading(true);
    try {
      const adminId = (session?.user as any)?.id;
      const res = await fetch(`/api/pendaftaran/${id}/verifikasi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, isKSU })
      });

      const data = await res.json();
      if (res.ok) {
        swalSuccess("Berhasil", "Verifikasi lunas berhasil. Santri masuk antrean asrama.");
        muatData();
      } else {
        swalError("Gagal", data.error || "Gagal memverifikasi");
      }
    } catch (e) {
      swalError("Error", "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const filtered = transaksi.filter(t => 
    t.statusPembayaran === "PENDING" &&
    (t.santri.nama.toLowerCase().includes(search.toLowerCase()) || 
     t.noKwitansi.toLowerCase().includes(search.toLowerCase()) ||
     t.totalTagihan.toString().includes(search))
  );

  return (
    <Protect permission="">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gold-500/10 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Meja Keuangan</h1>
            <p className="text-gray-400 mt-1">Verifikasi pembayaran pendaftaran online santri</p>
          </div>
          <input
            type="text"
            placeholder="Cari Nama / Invoice / Nominal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 bg-dark-800 text-gray-200 border border-gold-500/20 px-4 py-2 rounded-xl text-sm outline-none focus:border-gold-500/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-500 font-medium bg-dark-800 rounded-2xl border border-gold-500/10">
              Tidak ada tagihan yang menunggu verifikasi.
            </div>
          ) : (
            filtered.map(t => (
              <div key={t.id} className="bg-dark-800 rounded-2xl p-5 border border-gold-500/20 shadow-lg relative overflow-hidden group">
                {/* Kode Unik Highlight */}
                <div className="absolute top-0 right-0 bg-gold-500 text-black px-4 py-1 font-black text-sm rounded-bl-2xl shadow-sm">
                  {t.kodeUnik}
                </div>
                
                <h2 className="text-xl font-bold text-gray-200 mt-2 truncate pr-10">{t.santri.nama}</h2>
                <p className="text-xs text-gray-500 mb-4 font-mono">{t.noKwitansi}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-sm border-b border-dark-900 pb-2">
                    <span className="text-gray-400">Program</span>
                    <span className="font-bold text-gold-400 text-right">{t.program.nama}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-dark-900 pb-2">
                    <span className="text-gray-400">Total Transfer</span>
                    <span className="font-black text-xl text-white">Rp {new Intl.NumberFormat('id-ID').format(t.totalTagihan)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Status</span>
                    <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs font-bold border border-yellow-500/30">PENDING</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => prosesVerifikasi(t.id, false)}
                    disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-md active:scale-95"
                  >
                    Verifikasi Lunas
                  </button>
                  <button
                    onClick={() => prosesVerifikasi(t.id, true)}
                    disabled={loading}
                    title="Bypass tanpa bayar untuk santri Beasiswa/KSU"
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-sm transition shadow-md active:scale-95"
                  >
                    Jalur KSU
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Protect>
  );
}
