"use client";

import { useState, useEffect, useRef } from "react";
import { Protect, usePermissions } from "@/components/Protect";
import { swalSuccess, swalError } from "@/app/lib/swal";
import Image from "next/image";

interface Pengajar {
  id: string;
  nama: string;
  foto: string | null;
  trackRecord: string[];
  urutan: number;
  isActive: boolean;
}

export default function MasterPengajarPage() {
  const [pengajars, setPengajars] = useState<Pengajar[]>([]);
  const [loading, setLoading] = useState(false);
  const { hasAccess } = usePermissions();
  const canManage = hasAccess("manage_program");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editId, setEditId] = useState("");
  const [nama, setNama] = useState("");
  const [foto, setFoto] = useState("");
  const [trackRecordInput, setTrackRecordInput] = useState("");
  const [trackRecordList, setTrackRecordList] = useState<string[]>([]);
  const [urutan, setUrutan] = useState("0");
  const [isActive, setIsActive] = useState(true);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const muatData = async () => {
    try {
      const res = await fetch("/api/pengajar");
      if (res.ok) setPengajars(await res.json());
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
    setFoto("");
    setTrackRecordInput("");
    setTrackRecordList([]);
    setUrutan("0");
    setIsActive(true);
  };

  const bukaModalEdit = (p: Pengajar) => {
    setEditId(p.id);
    setNama(p.nama);
    setFoto(p.foto || "");
    setTrackRecordList(p.trackRecord || []);
    setTrackRecordInput("");
    setUrutan(p.urutan.toString());
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const tambahTrackRecord = () => {
    const trimmed = trackRecordInput.trim();
    if (trimmed && !trackRecordList.includes(trimmed)) {
      setTrackRecordList([...trackRecordList, trimmed]);
      setTrackRecordInput("");
    }
  };

  const hapusTrackRecord = (index: number) => {
    setTrackRecordList(trackRecordList.filter((_, i) => i !== index));
  };

  // --- Upload Logic ---
  const handleUpload = async (file: File) => {
    // Validasi client-side
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return swalError("Format Salah", "Hanya file PNG, JPG, atau WebP yang diperbolehkan.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return swalError("Terlalu Besar", "Ukuran file maksimal 5MB.");
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setFoto(data.url);
        swalSuccess("Berhasil", "Foto berhasil diupload!");
      } else {
        swalError("Gagal Upload", data.error || "Terjadi kesalahan saat upload.");
      }
    } catch {
      swalError("Error", "Gagal menghubungi server.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input agar bisa pilih file yang sama lagi
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simpanPengajar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = editId ? `/api/pengajar/${editId}` : "/api/pengajar";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama,
        foto,
        trackRecord: trackRecordList,
        urutan,
        isActive,
      }),
    });

    setLoading(false);
    if (res.ok) {
      swalSuccess("Berhasil", `Pengajar berhasil ${editId ? "diperbarui" : "ditambahkan"}`);
      setIsModalOpen(false);
      resetForm();
      muatData();
    } else {
      const data = await res.json();
      swalError("Gagal", data.error || "Gagal menyimpan pengajar");
    }
  };

  const hapusPengajar = async (id: string, nama: string) => {
    const { default: Swal } = await import("sweetalert2");
    const result = await Swal.fire({
      title: "Hapus Pengajar?",
      text: `Data ${nama} akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4af37",
      cancelButtonColor: "#555",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: "#1a1a1a",
      color: "#e5e7eb",
    });

    if (result.isConfirmed) {
      const res = await fetch(`/api/pengajar/${id}`, { method: "DELETE" });
      if (res.ok) {
        swalSuccess("Terhapus", "Data pengajar berhasil dihapus.");
        muatData();
      } else {
        swalError("Gagal", "Gagal menghapus pengajar.");
      }
    }
  };

  return (
    <Protect permission="view_program" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak</div>}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gold-500/10 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Asatidz Markaz Arabiyah</h1>
            <p className="text-gray-400 mt-1">Kelola profil tenaga pengajar profesional</p>
          </div>
          {canManage && (
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="bg-gold-500 text-black px-4 py-2 font-bold rounded-xl shadow-md hover:bg-gold-400 transition"
            >
              + Tambah Pengajar
            </button>
          )}
        </div>

        {/* Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pengajars.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500 font-medium bg-dark-800 rounded-2xl border border-gold-500/10">
              Belum ada data pengajar. Silakan tambahkan.
            </div>
          ) : (
            pengajars.map((p) => (
              <div key={p.id} className={`relative group bg-dark-800 rounded-2xl border overflow-hidden transition-all ${p.isActive ? 'border-gold-500/10 hover:border-gold-500/30' : 'border-red-500/20 opacity-60'}`}>
                {/* Photo */}
                <div className="relative w-full aspect-[3/4] bg-dark-900 overflow-hidden">
                  {p.foto ? (
                    <Image
                      src={p.foto}
                      alt={p.nama}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-[10px] font-black rounded-lg ${p.isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {p.isActive ? "AKTIF" : "NON-AKTIF"}
                    </span>
                  </div>
                  {/* Order Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 text-[10px] font-black rounded-lg bg-dark-900/80 text-gray-400 border border-white/10">
                      #{p.urutan}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2">{p.nama}</h3>
                  {p.trackRecord.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {p.trackRecord.slice(0, 3).map((item, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="text-gold-500 mt-0.5 shrink-0">✦</span>
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                      {p.trackRecord.length > 3 && (
                        <li className="text-xs text-gray-500 pl-5">+{p.trackRecord.length - 3} lainnya</li>
                      )}
                    </ul>
                  )}

                  {canManage && (
                    <div className="flex gap-2 pt-3 border-t border-gold-500/10">
                      <button
                        onClick={() => bukaModalEdit(p)}
                        className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-2 rounded-lg text-xs font-bold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => hapusPengajar(p.id, p.nama)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-lg text-xs font-bold transition"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gold-500/20 max-h-[90vh] flex flex-col">
              <div className="p-5 bg-dark-900 border-b border-gold-500/10 shrink-0">
                <h2 className="text-xl font-bold text-gold-500">{editId ? "Edit Pengajar" : "Tambah Pengajar Baru"}</h2>
              </div>
              <form onSubmit={simpanPengajar} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Nama Pengajar *</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50"
                    placeholder="Cth: Ustadz Ahmad Fauzi, Lc."
                  />
                </div>

                {/* FOTO UPLOAD SECTION */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Foto Pengajar</label>

                  {foto ? (
                    /* Preview uploaded photo */
                    <div className="relative group/photo">
                      <div className="relative w-full aspect-[3/4] max-w-[200px] rounded-2xl overflow-hidden border-2 border-gold-500/20 bg-dark-900">
                        <Image src={foto} alt="Preview" fill className="object-cover object-top" sizes="200px" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFoto("")}
                        className="mt-3 flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    /* Drag & Drop / Click to upload */
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${uploading
                        ? "border-gold-500/50 bg-gold-500/5"
                        : dragActive
                          ? "border-gold-500 bg-gold-500/10 scale-[1.02]"
                          : "border-white/10 bg-dark-900 hover:border-gold-500/30 hover:bg-dark-900/80"
                        }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-3 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm font-bold text-gold-500">Mengupload foto...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                            <svg className="w-7 h-7 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              {dragActive ? "Lepaskan untuk upload" : "Klik atau seret foto ke sini"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, atau WebP • Maks 5MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-1">Track Record / Prestasi</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackRecordInput}
                      onChange={(e) => setTrackRecordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); tambahTrackRecord(); } }}
                      className="flex-1 p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50"
                      placeholder="Cth: Alumni Al-Azhar Mesir"
                    />
                    <button
                      type="button"
                      onClick={tambahTrackRecord}
                      className="px-4 py-3 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition shrink-0"
                    >
                      +
                    </button>
                  </div>

                  {trackRecordList.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {trackRecordList.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-2.5 border border-white/5 group">
                          <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
                            <span className="text-gold-500 font-bold shrink-0">{index + 1}.</span>
                            <span className="truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => hapusTrackRecord(index)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Urutan Tampil</label>
                    <input
                      type="number"
                      value={urutan}
                      onChange={(e) => setUrutan(e.target.value)}
                      min="0"
                      className="w-full p-3 border border-dark-900 rounded-xl bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500/50"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActivePengajar"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 accent-gold-500"
                      />
                      <label htmlFor="isActivePengajar" className="font-bold text-sm text-gray-300">Tampilkan di Website</label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gold-500/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-400 font-bold hover:bg-dark-900 rounded-xl transition">Batal</button>
                  <button type="submit" disabled={loading || uploading} className="px-6 py-2.5 text-black font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 bg-gold-500 hover:bg-gold-400">
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
