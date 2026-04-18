"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { swalSuccess, swalError } from "@/app/lib/swal";
import { generateRegistrationPdf } from "@/app/lib/generateRegistrationPdf";

// Emsifa API URLs
const API_PROV = "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json";
const API_KAB = (id: string) => `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`;
const API_KEC = (id: string) => `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`;
const API_DESA = (id: string) => `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`;

export default function PendaftaranPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Data Program
  const [programs, setPrograms] = useState<any[]>([]);

  // State Wilayah
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  // Form Data
  const [formData, setFormData] = useState({
    nama: "",
    gender: "BANIN",
    nik: "",
    tempatLahir: "",
    tanggalLahir: "",
    namaOrtu: "",
    noWaOrtu: "",
    noWaSantri: "",
    provinsiId: "", provinsiNama: "",
    kabupatenId: "", kabupatenNama: "",
    kecamatanId: "", kecamatanNama: "",
    desaId: "", desaNama: "",
    detailAlamat: "",
    programId: ""
  });

  // Invoice Result
  const [invoice, setInvoice] = useState<any>(null);

  // Captcha
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const refreshCaptcha = () => {
    setCaptchaA(Math.floor(Math.random() * 10) + 1);
    setCaptchaB(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer("");
  };

  // Fetch Provinces & Programs on Mount
  useEffect(() => {
    refreshCaptcha();
    fetch(API_PROV).then(res => res.json()).then(data => setProvinces(data)).catch(() => { });
    fetch("/api/program").then(res => res.json()).then(data => setPrograms(data.filter((p: any) => p.isActive))).catch(() => { });

    // Load Cache
    const cachedData = localStorage.getItem("ppdb_pendaftaran_data");
    const cachedStep = localStorage.getItem("ppdb_pendaftaran_step");
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setFormData(parsed);
        if (parsed.provinsiId) fetch(API_KAB(parsed.provinsiId)).then(res => res.json()).then(data => setRegencies(data)).catch(() => { });
        if (parsed.kabupatenId) fetch(API_KEC(parsed.kabupatenId)).then(res => res.json()).then(data => setDistricts(data)).catch(() => { });
        if (parsed.kecamatanId) fetch(API_DESA(parsed.kecamatanId)).then(res => res.json()).then(data => setVillages(data)).catch(() => { });
      } catch(e) {}
    }
    if (cachedStep) {
      const s = parseInt(cachedStep, 10);
      if (!isNaN(s) && s >= 1 && s <= 3) setStep(s);
    }
  }, []);

  // Save Cache
  useEffect(() => {
    localStorage.setItem("ppdb_pendaftaran_data", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem("ppdb_pendaftaran_step", step.toString());
  }, [step]);

  // Handlers Wilayah
  const handleProvChange = async (e: any) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, provinsiId: id, provinsiNama: name, kabupatenId: "", kabupatenNama: "", kecamatanId: "", kecamatanNama: "", desaId: "", desaNama: "" });
    if (id) { fetch(API_KAB(id)).then(res => res.json()).then(data => setRegencies(data)); }
  };
  const handleKabChange = async (e: any) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, kabupatenId: id, kabupatenNama: name, kecamatanId: "", kecamatanNama: "", desaId: "", desaNama: "" });
    if (id) { fetch(API_KEC(id)).then(res => res.json()).then(data => setDistricts(data)); }
  };
  const handleKecChange = async (e: any) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, kecamatanId: id, kecamatanNama: name, desaId: "", desaNama: "" });
    if (id) { fetch(API_DESA(id)).then(res => res.json()).then(data => setVillages(data)); }
  };
  const handleDesaChange = (e: any) => {
    const id = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setFormData({ ...formData, desaId: id, desaNama: name });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 8) v = v.substring(0, 8);
    if (v.length >= 5) v = `${v.substring(0, 2)}/${v.substring(2, 4)}/${v.substring(4)}`;
    else if (v.length >= 3) v = `${v.substring(0, 2)}/${v.substring(2)}`;
    setFormData({ ...formData, tanggalLahir: v });
  };

  const handleNext = () => {
    // Validasi sederhana
    if (step === 1) {
      if (!formData.nama || !formData.nik || !formData.tanggalLahir || !formData.noWaOrtu) {
        return swalError("Error", "Mohon lengkapi data diri utama.");
      }
      const dateParts = formData.tanggalLahir.split("/");
      if (dateParts.length !== 3) return swalError("Format Salah", "Format tanggal lahir harus DD/MM/YYYY lengkap.");
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      if (day < 1 || day > 31) return swalError("Tidak Valid", "Tanggal lahir maksimal 31.");
      if (month < 1 || month > 12) return swalError("Tidak Valid", "Bulan lahir maksimal 12.");
      if (year < 1900 || year > new Date().getFullYear()) return swalError("Tidak Valid", "Tahun lahir tidak valid.");
    }
    
    if (step === 2 && (!formData.desaId || !formData.detailAlamat)) {
      return swalError("Error", "Mohon lengkapi alamat lengkap.");
    }
    setStep(step + 1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    swalSuccess("Tersalin!", "Nomor rekening berhasil disalin");
  };

  const handleSubmit = async () => {
    if (!formData.programId) return swalError("Error", "Silakan pilih program.");
    
    // Validasi Captcha
    if (parseInt(captchaAnswer, 10) !== captchaA + captchaB) {
      refreshCaptcha();
      return swalError("Verifikasi Gagal", "Jawaban matematika salah.");
    }

    // Format WA (08 -> 628)
    const formatWa = (wa: string) => {
      let f = wa.replace(/\D/g, "");
      if (f.startsWith("0")) f = "62" + f.substring(1);
      return f;
    };

    setLoading(true);
    try {
      const res = await fetch("/api/pendaftaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.nama,
          gender: formData.gender,
          nik: formData.nik,
          tempatLahir: formData.tempatLahir,
          tanggalLahir: formData.tanggalLahir.split('/').reverse().join('-'),
          namaOrtu: formData.namaOrtu,
          noWaOrtu: formatWa(formData.noWaOrtu),
          noWaSantri: formData.noWaSantri ? formatWa(formData.noWaSantri) : "",
          provinsi: formData.provinsiNama,
          kabupaten: formData.kabupatenNama,
          kecamatan: formData.kecamatanNama,
          desa: formData.desaNama,
          detailAlamat: formData.detailAlamat,
          programId: formData.programId
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setInvoice(data.data.transaksi);
        setStep(4); // Pindah ke layar Invoice
        localStorage.removeItem("ppdb_pendaftaran_data");
        localStorage.removeItem("ppdb_pendaftaran_step");
        try {
          generateRegistrationPdf({
            santri: data.data.santri,
            transaksi: data.data.transaksi,
            program: data.data.program,
            isRenew: false
          });
        } catch(e) {
          console.error("Gagal cetak PDF", e);
        }
      } else {
        swalError("Gagal", data.error || data.details || "Terjadi kesalahan.");
      }
    } catch (e) {
      setLoading(false);
      swalError("Error", "Gagal menghubungi server.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-luxury-pattern text-gray-200 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Image src="/images/logo.png" alt="Logo Markaz" width={80} height={80} className="mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold-500 mt-4 tracking-wide">Pendaftaran Online</h1>
          <p className="text-gray-400 mt-2">Markaz Arabiyyah</p>
        </div>

        {/* Stepper Progress */}
        {step < 4 && (
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-dark-800 rounded-full z-0">
              <div className="h-full bg-gold-500 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            </div>
            {[1, 2, 3].map((s) => (
              <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${step >= s ? 'bg-gold-500 border-gold-500 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-dark-900 border-dark-800 text-gray-500'}`}>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Card Form */}
        <div className="bg-dark-800/80 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-gold-500/20 shadow-2xl">

          {/* STEP 1: DATA DIRI */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-white border-b border-gold-500/10 pb-3 mb-6">Identitas Santri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Nama Lengkap Sesuai KTP/KK *</label>
                  <input type="text" value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="Cth: Muhammad Fatih" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">NIK (Nomor Induk Kependudukan) *</label>
                  <input type="number" value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="16 digit NIK" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Jenis Kelamin *</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white font-bold shadow-inner">
                    <option value="BANIN">Laki-laki (BANIN)</option>
                    <option value="BANAT">Perempuan (BANAT)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Tempat Lahir</label>
                    <input type="text" value={formData.tempatLahir} onChange={e => setFormData({ ...formData, tempatLahir: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="Cth: Kediri" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Tanggal Lahir *</label>
                    <input type="text" inputMode="numeric" value={formData.tanggalLahir} onChange={handleDateChange} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="DD/MM/YYYY" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gold-500/10 pt-6 mt-6">
                <h3 className="text-lg font-bold text-white mb-4">Kontak Wali & Santri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Nama Orang Tua/Wali *</label>
                    <input type="text" value={formData.namaOrtu} onChange={e => setFormData({ ...formData, namaOrtu: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="Nama wali yang bertanggung jawab" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Nomor WhatsApp Ortu *</label>
                    <input type="text" value={formData.noWaOrtu} onChange={e => setFormData({ ...formData, noWaOrtu: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="0812345..." />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-bold text-gray-400 mb-1">Nomor WhatsApp Santri (Opsional)</label>
                  <input type="text" value={formData.noWaSantri} onChange={e => setFormData({ ...formData, noWaSantri: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="0812345..." />
                </div>
              </div>

              <button onClick={handleNext} className="w-full mt-6 bg-gold-500 hover:bg-gold-400 text-black font-extrabold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-transform active:scale-95">Selanjutnya: Alamat</button>
            </div>
          )}

          {/* STEP 2: ALAMAT LENGKAP */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <button onClick={() => setStep(1)} className="text-gold-500 font-bold mb-4 flex items-center gap-2 hover:text-gold-400 transition">
                <span>&larr;</span> Kembali
              </button>
              <h2 className="text-2xl font-bold text-white border-b border-gold-500/10 pb-3 mb-6">Alamat Lengkap</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Provinsi *</label>
                  <select value={formData.provinsiId} onChange={handleProvChange} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white font-semibold shadow-inner">
                    <option value="">-- Pilih Provinsi --</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Kabupaten/Kota *</label>
                  <select value={formData.kabupatenId} onChange={handleKabChange} disabled={!formData.provinsiId} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white font-semibold disabled:opacity-50 shadow-inner">
                    <option value="">-- Pilih Kab/Kota --</option>
                    {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Kecamatan *</label>
                  <select value={formData.kecamatanId} onChange={handleKecChange} disabled={!formData.kabupatenId} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white font-semibold disabled:opacity-50 shadow-inner">
                    <option value="">-- Pilih Kecamatan --</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Desa/Kelurahan *</label>
                  <select value={formData.desaId} onChange={handleDesaChange} disabled={!formData.kecamatanId} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white font-semibold disabled:opacity-50 shadow-inner">
                    <option value="">-- Pilih Desa --</option>
                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Detail Alamat Lengkap (Jalan, RT/RW) *</label>
                <textarea rows={3} value={formData.detailAlamat} onChange={e => setFormData({ ...formData, detailAlamat: e.target.value })} className="w-full bg-dark-900 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white shadow-inner" placeholder="Cth: Jl. Sudirman No.10, RT 01 RW 02" />
              </div>

              <button onClick={handleNext} className="w-full mt-6 bg-gold-500 hover:bg-gold-400 text-black font-extrabold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-transform active:scale-95">Selanjutnya: Program</button>
            </div>
          )}

          {/* STEP 3: PILIH PROGRAM */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <button onClick={() => setStep(2)} className="text-gold-500 font-bold mb-4 flex items-center gap-2 hover:text-gold-400 transition">
                <span>&larr;</span> Kembali
              </button>
              <h2 className="text-2xl font-bold text-white border-b border-gold-500/10 pb-3 mb-6">Pilih Program</h2>

              {programs.length === 0 ? (
                <div className="text-center text-gray-500 p-10 bg-dark-900 rounded-xl">Sedang memuat daftar program...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {programs.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setFormData({ ...formData, programId: p.id })}
                      className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 ${formData.programId === p.id ? 'border-gold-500 bg-gold-500/5 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-dark-900 bg-dark-900 hover:border-gold-500/30'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-extrabold text-lg text-white">{p.nama}</h3>
                        <span className="bg-dark-800 text-gold-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{p.durasiBulan} Bulan</span>
                      </div>
                      <p className="text-2xl font-black text-gold-500 mt-4">Rp {new Intl.NumberFormat('id-ID').format(p.harga)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* CAPTCHA SECTION */}
              <div className="mt-8 bg-dark-900 border border-gold-500/20 p-5 rounded-2xl">
                <label className="block text-sm font-bold text-gray-400 mb-2">Verifikasi Keamanan *</label>
                <div className="flex items-center gap-4">
                  <div className="bg-dark-800 text-white font-mono text-xl font-bold py-3 px-6 rounded-xl border border-dark-700">
                    {captchaA} + {captchaB} = ?
                  </div>
                  <input 
                    type="number" 
                    value={captchaAnswer} 
                    onChange={(e) => setCaptchaAnswer(e.target.value)} 
                    placeholder="Jawaban" 
                    className="w-full max-w-[120px] bg-dark-800 border border-dark-900 focus:border-gold-500/50 rounded-xl p-3 outline-none text-white font-bold text-center"
                  />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading} className="w-full mt-8 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black font-extrabold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 disabled:opacity-50">
                {loading ? "Memproses..." : "Selesaikan Pendaftaran"}
              </button>
            </div>
          )}

          {/* STEP 4: INVOICE / SUCCESS */}
          {step === 4 && invoice && (
            <div className="text-center animate-fadeIn py-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Pendaftaran Berhasil!</h2>
              <p className="text-gray-400 mb-8">Data santri telah tersimpan. Silakan lakukan pembayaran agar dapat dikonfirmasi oleh Admin.</p>

              <div className="bg-dark-900 rounded-2xl p-6 border border-gold-500/20 shadow-inner max-w-sm mx-auto text-left relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gold-500/10 rounded-full blur-xl"></div>

                <p className="text-gray-400 text-sm font-bold mb-1">Nomor Kwitansi</p>
                <p className="font-mono text-gold-500 mb-4">{invoice.noKwitansi}</p>

                <p className="text-gray-400 text-sm font-bold mb-1">Nominal Transfer</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-white text-3xl font-black">Rp {new Intl.NumberFormat('id-ID').format(invoice.nominalProgram)}</span>
                </div>

                <p className="text-gray-400 text-sm font-bold mt-4 mb-1">Kode Unik Transfer</p>
                <p className="text-gold-500 text-2xl font-black">+{invoice.kodeUnik}</p>

                <div className="mt-6 pt-4 border-t border-dashed border-gray-700">
                  <p className="text-xs text-gray-500 text-center uppercase tracking-widest font-bold">Total Yang Harus Dibayar</p>
                  <p className="text-green-400 text-3xl font-black text-center mt-1">Rp {new Intl.NumberFormat('id-ID').format(invoice.totalTagihan)}</p>
                </div>

                <div className="bg-dark-800 p-4 rounded-xl border border-blue-500/20 mt-4 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Transfer ke Rekening</p>
                  <p className="text-xl font-black text-white font-mono tracking-widest">0555-01-001108-569</p>
                  <p className="text-sm font-bold text-blue-400 mt-1">BANK BRI a.n Markaz Arabiyah</p>
                  <button 
                    onClick={() => copyToClipboard('055501001108569')}
                    className="mt-3 bg-dark-900 hover:bg-black text-gray-300 px-4 py-2 rounded-lg text-sm font-bold border border-gray-700 hover:border-gold-500 transition-colors flex items-center justify-center gap-2 w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Salin No. Rekening
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-4 italic">
                  *Pastikan transfer tepat hingga 3 digit terakhir (+{invoice.kodeUnik}) agar otomatis terbaca oleh Admin.
                </p>
              </div>

              <div className="mt-10">
                <Link href="/" className="text-gold-500 font-bold hover:text-gold-400 transition underline underline-offset-4">
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
