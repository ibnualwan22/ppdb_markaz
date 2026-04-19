"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Protect } from "@/components/Protect";
import { swalSuccess, swalError } from "@/app/lib/swal";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#22c55e', '#ef4444']; // Green for PAID, Red for PENDING

export default function MejaKeuanganPage() {
  const { data: session } = useSession();
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [allDufah, setAllDufah] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState("AKTIF"); // "AKTIF" atau "GLOBAL"

  const muatData = async () => {
    try {
      const res = await fetch("/api/pendaftaran");
      if (res.ok) {
        const data = await res.json();
        setTransaksi(data.transaksi || []);
        setAllDufah(data.allDufah || []);
      }
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

  const handleTagihWa = (noWa: string, nama: string, tagihan: number) => {
    if (!noWa) return swalError("Error", "Nomor WA tidak tersedia");
    const pesan = `Assalamu'alaikum, Bapak/Ibu wali dari santri *${nama}*.\n\nKami dari Admin Markaz Arabiyah menginformasikan bahwa tagihan pendaftaran sebesar *Rp ${new Intl.NumberFormat('id-ID').format(tagihan)}* masih berstatus PENDING. Mohon segera melunasi ke rekening BRI 0555-01-001108-569 agar ananda bisa segera diproses kamar asramanya.\n\nJazakumullah khairan.`;
    window.open(`https://wa.me/${noWa}?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  const activeDufah = allDufah.find(d => d.isActive);
  const now = new Date();
  const targetDufah = allDufah.find(d => d.tanggalBuka && d.tanggalTutup && now >= new Date(d.tanggalBuka) && now <= new Date(d.tanggalTutup));

  // Filter scope
  const filteredByScope = filterScope === "AKTIF"
    ? transaksi.filter(t => {
        const matchesActive = activeDufah && (t.dufahTujuanId === activeDufah.id || t.noKwitansi.includes(`-${activeDufah.id}-`) || t.noKwitansi.includes(`RENEW-${activeDufah.id}-`));
        const matchesTarget = targetDufah && (t.dufahTujuanId === targetDufah.id || t.noKwitansi.includes(`-${targetDufah.id}-`) || t.noKwitansi.includes(`RENEW-${targetDufah.id}-`));
        return matchesActive || matchesTarget;
      })
    : transaksi;

  const totalLunas = filteredByScope
    .filter(t => t.statusPembayaran === "PAID" || t.statusPembayaran === "KSU_GRATIS")
    .reduce((acc, t) => acc + t.totalTagihan, 0);

  const totalPending = filteredByScope
    .filter(t => t.statusPembayaran === "PENDING")
    .reduce((acc, t) => acc + t.totalTagihan, 0);

  // Statistics Counts
  const countTotalPendaftar = filteredByScope.length;
  const countSudahBayar = filteredByScope.filter(t => t.statusPembayaran === "PAID" || t.statusPembayaran === "KSU_GRATIS").length;
  const countBelumBayar = filteredByScope.filter(t => t.statusPembayaran === "PENDING").length;

  const filteredData = filteredByScope.filter(t =>
    t.santri.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.noKwitansi.toLowerCase().includes(search.toLowerCase())
  );

  // Data for Charts
  const pieData = [
    { name: 'Sudah Bayar', value: totalLunas },
    { name: 'Belum Bayar', value: totalPending }
  ];

  const barData = allDufah.map(d => {
    const income = transaksi
      .filter(t => (t.noKwitansi.includes(`-${d.id}-`) || t.noKwitansi.includes(`RENEW-${d.id}-`)) && t.statusPembayaran === "PAID")
      .reduce((acc, t) => acc + t.totalTagihan, 0);
    return { name: d.nama, Pendapatan: income };
  });

  return (
    <Protect permission="">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gold-500/10 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Meja Keuangan</h1>
            <p className="text-gray-400 mt-1">Pemantauan dan verifikasi pembayaran</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <select 
              value={filterScope} 
              onChange={(e) => setFilterScope(e.target.value)}
              className="bg-dark-800 text-gold-500 font-bold border border-gold-500/20 px-4 py-2 rounded-xl text-sm outline-none focus:border-gold-500/50 cursor-pointer"
            >
              <option value="AKTIF">Filter: Duf'ah Aktif Saja</option>
              <option value="GLOBAL">Filter: Semua Data (Global)</option>
            </select>
            <input
              type="text"
              placeholder="Cari Nama / Invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 bg-dark-800 text-gray-200 border border-gold-500/20 px-4 py-2 rounded-xl text-sm outline-none focus:border-gold-500/50"
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
          <div className="bg-dark-800 border border-gold-500/20 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Pendaftar</p>
            <p className="text-2xl font-black text-white">{countTotalPendaftar} <span className="text-sm font-normal text-gray-500">Orang</span></p>
          </div>
          <div className="bg-dark-800 border border-green-500/20 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Sudah Bayar</p>
            <p className="text-2xl font-black text-green-400">{countSudahBayar} <span className="text-sm font-normal text-gray-500">Orang</span></p>
          </div>
          <div className="bg-dark-800 border border-red-500/20 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Belum Bayar</p>
            <p className="text-2xl font-black text-red-400">{countBelumBayar} <span className="text-sm font-normal text-gray-500">Orang</span></p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-800 border border-green-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl"></div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Nominal Sudah Ditransfer</p>
            <p className="text-3xl font-black text-green-400">Rp {new Intl.NumberFormat('id-ID').format(totalLunas)}</p>
          </div>
          <div className="bg-dark-800 border border-red-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Nominal Belum Ditransfer</p>
            <p className="text-3xl font-black text-red-400">Rp {new Intl.NumberFormat('id-ID').format(totalPending)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-dark-800 border border-gold-500/10 p-6 rounded-2xl shadow-lg h-[300px]">
            <h3 className="text-sm font-bold text-gray-400 mb-4 text-center">Rasio Pembayaran {activeDufah?.nama}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-dark-800 border border-gold-500/10 p-6 rounded-2xl shadow-lg lg:col-span-2 h-[300px]">
            <h3 className="text-sm font-bold text-gray-400 mb-4">Grafik Pendapatan per Duf'ah</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `Rp${val / 1000000}M`} />
                <Tooltip formatter={(value: any) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`} cursor={{ fill: '#2a2a2a' }} />
                <Bar dataKey="Pendapatan" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-dark-800 border border-gold-500/10 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-dark-900 border-b border-gold-500/20">
                <tr>
                  <th className="px-4 py-4 text-center w-12">No</th>
                  <th className="px-4 py-4">Tgl Mendaftar</th>
                  <th className="px-4 py-4">Nama Santri</th>
                  <th className="px-4 py-4">Program</th>
                  <th className="px-4 py-4 text-right">Biaya (Rp)</th>
                  <th className="px-4 py-4 text-center">Pencatat</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">Tidak ada data pendaftaran di {activeDufah?.nama}</td>
                  </tr>
                ) : (
                  filteredData.map((t, index) => (
                    <tr key={t.id} className="border-b border-gray-800 hover:bg-dark-900/50 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="px-4 py-4 text-xs font-mono text-gray-400">{new Date(t.createdAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                      <td className="px-4 py-4 font-bold text-white">
                        {t.santri.nama}
                        <div className="text-[10px] text-gray-500 font-mono mt-1">{t.noKwitansi}</div>
                      </td>
                      <td className="px-4 py-4">
                        {t.program.nama}
                        <div className="text-xs text-gold-500 mt-0.5">{t.program.durasiBulan} Bulan</div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm">
                        {new Intl.NumberFormat('id-ID').format(t.totalTagihan)}
                        <div className="text-[10px] text-gray-500 mt-0.5">Kode: +{t.kodeUnik}</div>
                      </td>
                      <td className="px-4 py-4 text-center text-xs font-bold text-blue-400">
                        {t.admin?.nama || "-"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {t.statusPembayaran === "PAID" ? (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs font-bold border border-green-500/30">LUNAS</span>
                        ) : t.statusPembayaran === "KSU_GRATIS" ? (
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-xs font-bold border border-purple-500/30">LUNAS (KSU)</span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-bold border border-red-500/30">PENDING</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {t.statusPembayaran === "PENDING" && (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => prosesVerifikasi(t.id, false)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                            >
                              ✓ Acc
                            </button>
                            <button
                              onClick={() => handleTagihWa(t.santri.noWaOrtu, t.santri.nama, t.totalTagihan)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                            >
                              WA
                            </button>
                            <button
                              onClick={() => prosesVerifikasi(t.id, true)}
                              disabled={loading}
                              title="Bypass tanpa bayar untuk santri Beasiswa/KSU"
                              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                            >
                              KSU
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Protect>
  );
}
