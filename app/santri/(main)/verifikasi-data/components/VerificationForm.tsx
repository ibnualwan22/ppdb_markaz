"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VerificationFormProps {
  initialData: {
    nama: string;
    tempatLahir: string | null;
    tanggalLahir: Date | null;
    namaOrtu: string | null;
  };
}

export default function VerificationForm({ initialData }: VerificationFormProps) {
  const router = useRouter();
  
  // Form states
  const [nama, setNama] = useState(initialData.nama || "");
  const [tempatLahir, setTempatLahir] = useState(initialData.tempatLahir || "");
  const [tanggalLahir, setTanggalLahir] = useState(
    initialData.tanggalLahir
      ? new Date(initialData.tanggalLahir).toISOString().split("T")[0]
      : ""
  );
  const [namaOrtu, setNamaOrtu] = useState(initialData.namaOrtu || "");
  
  const [isChecked, setIsChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !tempatLahir || !tanggalLahir || !namaOrtu) {
      setErrorMessage("Semua kolom data diri wajib diisi.");
      return;
    }
    if (!isChecked) {
      setErrorMessage("Anda harus menyetujui pernyataan deklarasi data diri.");
      return;
    }
    setErrorMessage("");
    setIsModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsModalOpen(false);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/santri/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, tempatLahir, tanggalLahir, namaOrtu }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        router.push("/santri/dashboard");
        router.refresh();
      } else {
        setErrorMessage(json.error || "Gagal memproses verifikasi data.");
      }
    } catch (err) {
      setErrorMessage("Terjadi kesalahan koneksi internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm relative overflow-hidden space-y-6">
        {/* Warning Banner */}
        <div className="bg-red-500/10 border-l-4 border-red-500 p-5 rounded-xl shadow-sm flex gap-4">
          <div className="text-red-500 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-500 font-black text-lg">PENTING & KRUSIAL! ⚠️</h3>
            <p className="text-red-300 text-sm mt-1.5 leading-relaxed font-semibold">
              Pengubahan data diri hanya dapat dilakukan <span className="text-white underline">SEKALI SEUMUR HIDUP</span> di portal ini. Mohon teliti, periksa ejaan huruf demi huruf agar persis dengan yang tertera di <span className="text-white">Kartu Keluarga (KK)</span> Anda sebelum menekan tombol simpan.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-300 text-sm font-bold animate-pulse">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Nama Lengkap (Sesuai KK)</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 focus:border-gold-500 text-white rounded-xl py-3 px-4 outline-none font-bold transition-all text-sm uppercase"
              placeholder="CONTOH: MUHAMMAD FULAN AL-FARISI"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tempat Lahir */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Tempat Lahir (Sesuai KK)</label>
              <input
                type="text"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 focus:border-gold-500 text-white rounded-xl py-3 px-4 outline-none font-bold transition-all text-sm uppercase"
                placeholder="CONTOH: SURABAYA"
                required
              />
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Tanggal Lahir (Sesuai KK)</label>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full bg-dark-900 border border-dark-800 focus:border-gold-500 text-white rounded-xl py-3 px-4 outline-none font-bold transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Nama Orang Tua */}
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Nama Ayah Kandung / Wali (Sesuai KK)</label>
            <input
              type="text"
              value={namaOrtu}
              onChange={(e) => setNamaOrtu(e.target.value)}
              className="w-full bg-dark-900 border border-dark-800 focus:border-gold-500 text-white rounded-xl py-3 px-4 outline-none font-bold transition-all text-sm uppercase"
              placeholder="CONTOH: AHMAD SUBARJO (AKAN TERTULIS BIN AHMAD SUBARJO)"
              required
            />
            <p className="text-gray-500 text-[10px] mt-1.5 leading-snug">Nama Ayah kandung sangat penting untuk disematkan sebagai penulisan nasab Bin/Binti di lembar Syahadah.</p>
          </div>

          {/* Checklist Pernyataan */}
          <div className="pt-4 border-t border-dark-800">
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 accent-gold-500 h-4 w-4 bg-dark-900 rounded border-dark-800"
              />
              <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors leading-relaxed">
                Saya menyatakan bahwa data yang saya masukkan di atas sudah benar dan sesuai dengan <strong className="text-white">Kartu Keluarga (KK)</strong>. Saya memahami bahwa kesalahan penulisan nama atau data pada Syahadah akibat kesalahan saya mengisi form ini di luar tanggung jawab Markaz Arabiyah, dan <strong className="text-white">saya tidak dapat mengubah data ini lagi di kemudian hari.</strong>
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !isChecked}
              className="flex-1 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black py-4 px-6 rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Simpan & Kunci Data DiriPermanen"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push("/santri/dashboard")}
              className="px-6 py-4 border border-dark-800 hover:bg-dark-800 text-gray-400 font-bold rounded-xl transition-all"
            >
              Kembali
            </button>
          </div>
        </form>
      </div>

      {/* Double Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0c0c0c] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scale-up space-y-6">
            <div className="text-red-500 flex justify-center">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-white font-black text-xl">APAKAH ANDA YAKIN? ⚠️</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Anda hanya bisa mengubah data diri ini <strong className="text-red-400">SATU KALI</strong>. Pastikan tidak ada kesalahan ejaan eja satu per satu data di bawah:
              </p>
            </div>

            <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">Nama Lengkap:</span>
                <span className="text-white font-black text-base">{nama}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">Tempat Lahir:</span>
                  <span className="text-gray-200 font-bold">{tempatLahir}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">Tanggal Lahir:</span>
                  <span className="text-gray-200 font-bold">
                    {tanggalLahir ? new Date(tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-xs block font-bold uppercase tracking-wider">Nama Ayah / Wali:</span>
                <span className="text-white font-bold">{namaOrtu}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmSave}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                Ya, Simpan Permanen!
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-dark-900 border border-dark-800 hover:bg-dark-800 text-gray-300 font-bold py-3 px-4 rounded-xl transition-all"
              >
                Periksa Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
