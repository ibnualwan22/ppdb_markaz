"use client";

import { useState, useEffect } from "react";
import { Protect, usePermissions } from "@/components/Protect";
import { swalSuccess, swalError } from "@/app/lib/swal";

export default function MasterProgramPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { hasAccess } = usePermissions();
  const canManage = hasAccess("manage_program");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState("");
  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [durasiBulan, setDurasiBulan] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [kategoriProgram, setKategoriProgram] = useState("REGULER");
  const [tanggalMulaiDefault, setTanggalMulaiDefault] = useState("10 Juni");
  const [tanggalTutupDefault, setTanggalTutupDefault] = useState("06 Juli");
  const [targetDufahId, setTargetDufahId] = useState("");
  const [allDufah, setAllDufah] = useState<any[]>([]);

  const muatData = async () => {
    try {
      const res = await fetch("/api/program");
      if (res.ok) setPrograms(await res.json());

      const resDufah = await fetch("/api/dufah");
      if (resDufah.ok) {
        const dufahs = await resDufah.json();
        // Sort by ID descending so newest is on top
        setAllDufah(dufahs.sort((a: any, b: any) => b.id - a.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const resetForm = () => {
    setEditId("");
    setNama("");
    setHarga("");
    setDurasiBulan("1");
    setIsActive(true);
    setKategoriProgram("REGULER");
    setTanggalMulaiDefault("10 Juni");
    setTanggalTutupDefault("06 Juli");
    setTargetDufahId("");
  };

  const bukaModalEdit = (p: any) => {
    setEditId(p.id);
    setNama(p.nama);
    setHarga(p.harga.toString());
    setDurasiBulan(p.durasiBulan.toString());
    setIsActive(p.isActive);
    setKategoriProgram(p.kategoriProgram || "REGULER");
    setTanggalMulaiDefault(p.tanggalMulaiDefault || "10 Juni");
    setTanggalTutupDefault(p.tanggalTutupDefault || "06 Juli");
    setTargetDufahId(p.targetDufahId ? p.targetDufahId.toString() : "");
    setIsModalOpen(true);
  };

  const simpanProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editId ? `/api/program/${editId}` : "/api/program";
    const method = editId ? "PATCH" : "POST";

    const bodyParams = {
      nama,
      harga,
      durasiBulan,
      isActive,
      kategoriProgram,
      tanggalMulaiDefault,
      tanggalTutupDefault,
      targetDufahId: targetDufahId || null
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyParams),
    });

    setLoading(false);
    if (res.ok) {
      swalSuccess("Berhasil", `Program berhasil ${editId ? "diperbarui" : "ditambahkan"}`);
      setIsModalOpen(false);
      resetForm();
      muatData();
    } else {
      const data = await res.json();
      swalError("Gagal", data.error || "Gagal menyimpan program");
    }
  };

  return (
    <Protect permission="view_program" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk melihat Master Program.</div>}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gold-500/10 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Master Program</h1>
            <p className="text-gray-400 mt-1">Kelola program pendidikan dan paket asrama</p>
          </div>
          {canManage && (
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-gold-500 text-black px-4 py-2 font-bold rounded-xl shadow-md hover:bg-gold-400 transition"
            >
              + Tambah Program
            </button>
          )}
        </div>

        <div className="bg-dark-800 rounded-2xl p-6 border border-gold-500/10 shadow-inner">
          {programs.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium">Belum ada program. Silakan tambahkan program baru.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-dark-900 text-gold-500 text-sm font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Nama Program</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Target Periode</th>
                    <th className="p-3">Harga (Rp)</th>
                    <th className="p-3 text-center">Durasi (Bulan)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 divide-y divide-gold-500/10">
                  {programs.map(p => (
                    <tr key={p.id} className="hover:bg-dark-900/50 transition">
                      <td className="p-3 font-semibold">{p.nama}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${p.kategoriProgram === 'TUROTS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : p.kategoriProgram === '2MINGGU' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
                          {p.kategoriProgram || 'REGULER'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${p.targetDufahId ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-dark-900 text-gray-500 border border-dark-800'}`}>
                          {p.targetDufahId ? `Khusus Duf'ah ${allDufah.find(d => d.id === p.targetDufahId)?.nama || p.targetDufahId}` : "Semua Periode"}
                        </span>
                      </td>
                      <td className="p-3">{new Intl.NumberFormat('id-ID').format(p.harga)}</td>
                      <td className="p-3 text-center font-bold text-gray-400">{p.durasiBulan} Bulan</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${p.isActive ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-red-500/10 text-red-500 border border-red-500/30"}`}>
                          {p.isActive ? "AKTIF" : "NON-AKTIF"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {canManage && (
                          <button
                            onClick={() => bukaModalEdit(p)}
                            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gold-500/20">
              <div className="p-5 bg-dark-900 border-b border-gold-500/10">
                <h2 className="text-xl font-bold text-gold-500">{editId ? "Edit Program" : "Tambah Program Baru"}</h2>
              </div>
              <form onSubmit={simpanProgram} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Nama Program</label>
                  <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50" placeholder="Cth: Intensif 3 Bulan" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Harga (Rp)</label>
                  <input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} required className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50" placeholder="Cth: 1500000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Durasi (Bulan)</label>
                  <input type="number" value={durasiBulan} onChange={(e) => setDurasiBulan(e.target.value)} required min="1" className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Kategori Program</label>
                  <select value={kategoriProgram} onChange={(e) => setKategoriProgram(e.target.value)} className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gold-500 font-bold outline-none focus:ring-1 focus:ring-gold-500/50 cursor-pointer">
                    <option value="REGULER">REGULER (Fokus Bahasa)</option>
                    <option value="TUROTS">TUROTS (Fokus Kitab Kuning)</option>
                    <option value="2MINGGU">2 MINGGU (Program Khusus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Tersedia Untuk Periode (Duf'ah)</label>
                  <select value={targetDufahId} onChange={(e) => setTargetDufahId(e.target.value)} className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50 cursor-pointer">
                    <option value="">Semua Periode Aktif</option>
                    {allDufah.map(df => (
                      <option key={df.id} value={df.id}>Khusus Duf'ah {df.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Tgl Mulai Pendaftaran</label>
                    <input type="text" value={tanggalMulaiDefault} onChange={(e) => setTanggalMulaiDefault(e.target.value)} required className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50" placeholder="Cth: 10 Juni" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Tgl Tutup Pendaftaran</label>
                    <input type="text" value={tanggalTutupDefault} onChange={(e) => setTanggalTutupDefault(e.target.value)} required className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50" placeholder="Cth: 06 Juli" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-gold-500" />
                  <label htmlFor="isActive" className="font-bold text-sm text-gray-300">Program Aktif (Dapat dipilih santri)</label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
                  <button type="submit" disabled={loading} className="px-6 py-2.5 text-black font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 bg-gold-500 hover:bg-gold-400">
                    {loading ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Protect>
  );
}
