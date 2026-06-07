"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { swalSuccess, swalError } from "@/app/lib/swal";
import { generateRegistrationPdf } from "@/app/lib/generateRegistrationPdf";
import { useSession } from "next-auth/react";

export default function SantriDaftarUlangPage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState(2); // Langsung ke step 2
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [targetDufah, setTargetDufah] = useState<any>(null);

  // Data Santri dari API internal
  const [santriData, setSantriData] = useState<any>(null);

  // Pilihan
  const [programId, setProgramId] = useState("");
  const [isBeliAtribut, setIsBeliAtribut] = useState(false);

  // Hasil Akhir
  const [invoice, setInvoice] = useState<any>(null);

  // Agreement
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    fetch("/api/program").then(res => res.json()).then(data => setPrograms(data.filter((p: any) => p.isActive))).catch(() => { });
    fetch("/api/dufah").then(res => res.json()).then(data => {
      const now = new Date();
      const target = data.find((df: any) => {
        if (!df.tanggalBuka || !df.tanggalTutup) return false;
        return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
      });
      if (target) {
        target.namaPeriodeLengkap = target.nama;
      }
      setTargetDufah(target || null);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.username) {
      setLoading(true);
      fetch(`/api/santri/profile-by-nis?nis=${session.user.username}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setSantriData(data.data);
          } else {
            swalError("Error", "Data santri tidak ditemukan");
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [status, session]);

  const handleRenew = async () => {
    if (!programId) return swalError("Pilih Program", "Anda harus memilih program untuk melanjutkan.");

    setLoading(true);
    try {
      const res = await fetch("/api/pendaftaran/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ santriId: santriData.id, programId, isBeliAtribut })
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setInvoice(data.data.transaksi);
        setStep(3);
        try {
          generateRegistrationPdf({
            santri: santriData,
            transaksi: data.data.transaksi,
            program: data.data.program,
            dufah: data.data.dufah,
            isRenew: true
          });
        } catch (e) {
          console.error("Gagal cetak PDF", e);
        }
      } else {
        swalError("Gagal", data.error || "Terjadi kesalahan");
      }
    } catch (e) {
      setLoading(false);
      swalError("Error", "Gagal menghubungi server");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    swalSuccess("Tersalin!", "Nomor rekening berhasil disalin");
  };

  if (status === "loading" || (loading && !santriData)) {
    return <div className="text-center p-10 text-gray-400">Memuat data...</div>;
  }

  return (
    <div className="animate-fadeIn pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Daftar <span className="text-gold-500">Ulang</span></h1>
        <p className="text-gray-400 text-sm mt-1">Daftar Ulang Program Markaz Arabiyah</p>
      </div>

      <div className="bg-dark-950 border border-dark-800 p-6 md:p-8 rounded-2xl shadow-sm">
        {/* STEP 2: PILIH PROGRAM */}
        {step === 2 && santriData && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-dark-900 border border-gold-500/30 p-5 rounded-2xl flex items-center gap-4">
              <div className="bg-gold-500/20 text-gold-500 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                {santriData.nama.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-white font-extrabold text-xl">{santriData.nama}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-gray-400 font-mono bg-dark-800 px-2 py-0.5 rounded border border-gray-700">{santriData.nis || "Belum ada NIS"}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${santriData.isAktif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {santriData.isAktif ? "AKTIF" : "NON-AKTIF"}
                  </span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white border-b border-gold-500/10 pb-3 mt-6">
              {santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id
                ? "Klaim Kuota Paket Anda"
                : "Pilih Program Daftar Ulang"}
            </h2>

            {santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id && (
              <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 mb-4 rounded-r-xl">
                <p className="text-emerald-400 font-bold text-sm">Anda masih memiliki sisa paket aktif (S/d Duf'ah {santriData.batasAktifDufah}). Silakan pilih program yang akan Anda ambil di Periode {targetDufah.namaPeriodeLengkap || targetDufah.nama}.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs
                .filter(p => {
                  const isKlaim = santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id;
                  if (isKlaim) {
                    const sisaKuota = santriData.batasAktifDufah - targetDufah.id + 1;
                    return p.durasiBulan <= 2 && p.durasiBulan <= sisaKuota;
                  }
                  return true;
                })
                .map(p => {
                  const tgMulai = p.tanggalMulaiDefault || "10";
                  const tgTutup = p.tanggalTutupDefault || "06";

                  let displayMulai = tgMulai;
                  let displayTutup = tgTutup;

                  if (targetDufah && targetDufah.tanggalBuka) {
                    if (/^\d+$/.test(tgMulai.trim())) {
                      const d = new Date(targetDufah.tanggalBuka);
                      d.setMonth(d.getMonth() + 1);
                      displayMulai = `${tgMulai.trim()} ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
                    }
                    if (/^\d+$/.test(tgTutup.trim())) {
                      const d = new Date(targetDufah.tanggalBuka);
                      d.setMonth(d.getMonth() + 1 + p.durasiBulan);
                      displayTutup = `${tgTutup.trim()} ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
                    }
                  }

                  const isKlaim = santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id;
                  const hargaTampil = isKlaim ? 0 : (isBeliAtribut ? p.harga : p.harga - 100000);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setProgramId(p.id)}
                      className={`cursor-pointer border-2 rounded-2xl p-5 transition-all duration-300 flex flex-col ${programId === p.id ? 'border-gold-500 bg-gold-500/5 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-dark-900 bg-dark-900 hover:border-gold-500/30'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-extrabold text-lg text-white">{p.nama}</h3>
                        <span className="bg-dark-800 text-gold-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{p.durasiBulan} Bulan</span>
                      </div>
                      <div className="mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${targetDufah ? 'bg-dark-800 text-gray-400' : 'bg-red-900/50 text-red-400'}`}>
                          {targetDufah ? `Periode ${targetDufah.namaPeriodeLengkap || targetDufah.nama}` : "Pendaftaran Sedang Ditutup"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 flex-grow">Tgl Program: <strong className="text-gray-300">{displayMulai} - {displayTutup}</strong></p>

                      <div className="mt-4 pt-4 border-t border-dark-800">
                        {isKlaim ? (
                          <p className={`text-sm font-bold inline-block px-3 py-1.5 rounded-lg border transition-colors ${programId === p.id ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-dark-800 text-gray-400 border-dark-700'}`}>✓ Pilih program ini</p>
                        ) : (
                          <p className="text-2xl font-black text-gold-500">Rp {new Intl.NumberFormat('id-ID').format(hargaTampil)}</p>
                        )}

                        {!isBeliAtribut && !isKlaim && (
                          <p className="text-xs text-green-500 font-bold mt-1">Diskon Atribut Santri Lama (-100k)</p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Spacer agar konten tidak tertutup floating bar */}
            {programId && <div className="h-72"></div>}
          </div>
        )}

        {/* STEP 3: INVOICE / SUCCESS */}
        {step === 3 && invoice && (
          <div className="text-center animate-fadeIn py-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Tagihan Diterbitkan!</h2>
            <p className="text-gray-400 mb-8">Silakan lakukan pembayaran agar masa aktif/langganan Anda segera diperbarui.</p>

            <div className="bg-dark-900 rounded-2xl p-6 border border-gold-500/20 shadow-inner max-w-sm mx-auto text-left relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gold-500/10 rounded-full blur-xl"></div>

              <p className="text-gray-400 text-sm font-bold mb-1">Nomor Kwitansi</p>
              <p className="font-mono text-gold-500 mb-4">{invoice.noKwitansi}</p>

              <p className="text-gray-400 text-sm font-bold mb-1">Total Yang Harus Dibayar</p>
              <p className="text-green-400 text-3xl font-black mt-1 mb-4">Rp {new Intl.NumberFormat('id-ID').format(invoice.totalTagihan)}</p>

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
              <Link href="/santri/keuangan" className="text-gold-500 font-bold hover:text-gold-400 transition underline underline-offset-4">
                Cek Riwayat Pembayaran
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING BOTTOM BAR - Di luar semua container */}
      {step === 2 && santriData && programId && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
          <div className="max-w-3xl mx-auto px-4 pb-24 md:pb-6">
            <div className="bg-dark-800 border border-gold-500/30 rounded-2xl shadow-[0_-5px_30px_rgba(0,0,0,0.5)] p-4 space-y-3">
              {(() => {
                const selected = programs.find(p => p.id === programId);
                const isKlaim = santriData.batasAktifDufah && targetDufah && santriData.batasAktifDufah >= targetDufah.id;
                const hargaTampil = isKlaim ? 0 : (isBeliAtribut ? (selected?.harga || 0) : (selected?.harga || 0) - 100000);
                return selected ? (
                  <div className="flex justify-between items-center bg-dark-900 rounded-xl px-4 py-2.5 border border-gold-500/10">
                    <div>
                      <p className="text-xs text-gray-400">Program Terpilih</p>
                      <p className="font-bold text-white text-sm">{selected.nama} ({selected.durasiBulan} Bulan)</p>
                    </div>
                    <p className="text-gold-500 font-black text-lg">
                      {isKlaim ? <span className="text-emerald-400">GRATIS</span> : `Rp ${new Intl.NumberFormat('id-ID').format(hargaTampil)}`}
                    </p>
                  </div>
                ) : null;
              })()}
              {(!santriData.batasAktifDufah || !targetDufah || santriData.batasAktifDufah < targetDufah.id) && (
                <div className="flex items-start gap-3 px-1">
                  <input type="checkbox" id="beliAtributFloat" checked={isBeliAtribut} onChange={(e) => setIsBeliAtribut(e.target.checked)} className="mt-0.5 w-5 h-5 accent-gold-500 cursor-pointer shrink-0" />
                  <label htmlFor="beliAtributFloat" className="cursor-pointer text-xs text-gray-400 leading-relaxed"><span className="font-bold text-gray-200">Beli Atribut Baru</span> (+Rp 100.000)</label>
                </div>
              )}
              <div className="flex items-start gap-3 px-1">
                <input type="checkbox" id="agreement" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="mt-0.5 w-5 h-5 accent-gold-500 cursor-pointer shrink-0" />
                <label htmlFor="agreement" className="cursor-pointer text-xs text-gray-400 leading-relaxed"><span className="font-bold text-gray-200">Saya setuju</span> untuk tidak merefund atau mengalihkan pembayaran.</label>
              </div>
              <button onClick={handleRenew} disabled={loading || !isAgreed || !targetDufah} className="w-full bg-gradient-to-r from-gold-600 to-gold-400 text-black font-extrabold py-3 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all active:scale-95 disabled:opacity-50 text-sm">
                {loading ? "Memproses..." : targetDufah ? "Selesaikan Daftar Ulang →" : "Pendaftaran Ditutup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
