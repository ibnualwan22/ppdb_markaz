"use client";

import { useState, useEffect } from "react";
import { Protect } from "@/components/Protect";
import { swalSuccess, swalError } from "../../../lib/swal";

// SVG Icons
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconMale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-blue-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);
const IconFemale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-pink-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);

export default function SantriTanpaNisPage() {
  const [dataSantri, setDataSantri] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const muatDataSantri = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/santri?filter=AKTIF");
      if (res.ok) {
        const allData = await res.json();
        // Filter out santri that have an NIS
        const santriTanpaNis = allData.filter((s: any) => !s.nis || s.nis.trim() === "");
        
        // Sort by Sakan > Kamar > Lemari
        santriTanpaNis.sort((a: any, b: any) => {
          const rA = a.riwayat?.[0]?.lemari;
          const rB = b.riwayat?.[0]?.lemari;
          
          const sakanA = rA?.kamar?.sakan?.nama || "zzzzz";
          const sakanB = rB?.kamar?.sakan?.nama || "zzzzz";
          if (sakanA !== sakanB) return sakanA.localeCompare(sakanB);
          
          const kamarA = rA?.kamar?.nama || "zzzzz";
          const kamarB = rB?.kamar?.nama || "zzzzz";
          if (kamarA !== kamarB) return kamarA.localeCompare(kamarB);
          
          const lemariA = rA?.nomor || "zzzzz";
          const lemariB = rB?.nomor || "zzzzz";
          return lemariA.localeCompare(lemariB);
        });

        setDataSantri(santriTanpaNis);
      }
    } catch (error) {
      console.error("Gagal memuat master santri", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    muatDataSantri();
  }, []);

  const handleCopyData = () => {
    if (dataSantri.length === 0) {
      swalError("Tidak ada data untuk disalin.");
      return;
    }

    let textToCopy = "*DATA SANTRI BELUM ADA NIS*\n\n";

    dataSantri.forEach((santri, index) => {
      const riwayatAktif = santri.riwayat?.[0];
      const sakan = riwayatAktif?.lemari?.kamar?.sakan?.nama || "Belum ada sakan";
      const kamar = riwayatAktif?.lemari?.kamar?.nama || "-";
      const lemari = riwayatAktif?.lemari?.nomor || "-";
      
      textToCopy += `${index + 1}. *Nama*: ${santri.nama}\n`;
      textToCopy += `   *Sakan*: ${sakan}\n`;
      textToCopy += `   *Kamar*: ${kamar}\n`;
      textToCopy += `   *Lemari*: ${lemari}\n\n`;
    });

    navigator.clipboard.writeText(textToCopy);
    swalSuccess("Berhasil Disalin!", "Data santri tanpa NIS telah disalin ke clipboard.");
  };

  return (
    <Protect permission="view_santri" fallback={<div className="p-10 text-center text-red-500 font-bold text-2xl mt-20">Akses Ditolak: Anda tidak memiliki izin untuk melihat data ini.</div>}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gold-500/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Santri Tanpa NIS</h1>
            <p className="text-gray-400 mt-1 font-medium">Daftar santri aktif yang belum memiliki Nomor Induk Santri.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button 
              onClick={handleCopyData}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] text-sm flex items-center gap-1 transition-all active:scale-95"
            >
              <IconClipboard /> Salin Data
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="bg-dark-800 text-gold-500 font-bold text-sm px-3 py-1.5 rounded-xl border border-gold-500/20">
            Total: {dataSantri.length} santri
          </span>
        </div>

        <div className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-dark-900 border-b border-gold-500/20 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-gold-600 font-bold text-center w-12">No</th>
                  <th className="p-4 text-gold-600 font-bold">Nama Lengkap</th>
                  <th className="p-4 text-gold-600 font-bold">Kategori</th>
                  <th className="p-4 text-gold-600 font-bold">Sakan</th>
                  <th className="p-4 text-gold-600 font-bold">Lemari</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                        <span className="text-gray-400 font-medium">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : dataSantri.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500 font-medium">Tidak ada santri yang belum memiliki NIS.</td>
                  </tr>
                ) : (
                  dataSantri.map((santri, index) => {
                    const riwayatAktif = santri.riwayat?.[0];
                    const sakan = riwayatAktif?.lemari?.kamar?.sakan?.nama || "-";
                    const kamar = riwayatAktif?.lemari?.kamar?.nama || "-";
                    const lemari = riwayatAktif?.lemari?.nomor || "-";
                    
                    return (
                      <tr key={santri.id} className="border-b border-gold-500/5 hover:bg-dark-900/50 transition">
                        <td className="p-4 text-center">
                          <span className="bg-dark-900 border border-gold-500/20 text-gold-500 font-bold text-xs w-7 h-7 rounded-full inline-flex items-center justify-center">
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-lg flex items-center gap-2 text-gray-200">
                            {santri.nama} {santri.gender === 'BANAT' ? <IconFemale /> : <IconMale />}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Terdaftar: {new Date(santri.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-xs font-bold rounded-lg shadow-sm text-white ${santri.kategori === 'KSU' ? 'bg-purple-900/80' : santri.kategori === 'LAMA' ? 'bg-orange-800' : 'bg-green-800'}`}>
                            {santri.kategori}
                          </span>
                        </td>
                        <td className="p-4 text-gold-400 font-bold">
                          {sakan}
                        </td>
                        <td className="p-4 text-gray-300">
                          {riwayatAktif?.lemari ? `Kamar ${kamar} - Loker ${lemari}` : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Protect>
  );
}
