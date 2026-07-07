"use client";

import { useState, useEffect } from "react";
import { Protect } from "@/components/Protect";
import { swalError, swalSuccess } from "@/app/lib/swal";
import { useRouter } from "next/navigation";

const IconHistory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

export default function MutasiSakanPage() {
  const [dataMutasi, setDataMutasi] = useState<any[]>([]);
  const [dufahAktif, setDufahAktif] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filterGender, setFilterGender] = useState("SEMUA");
  const [selectedRiwayat, setSelectedRiwayat] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/asrama/mutasi-sakan")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setDataMutasi(data.daftarMutasi || []);
          setDufahAktif(data.dufahAktif || "-");
        } else {
          swalError("Gagal", data.error);
        }
      })
      .catch(err => {
        swalError("Error", "Gagal memuat data mutasi");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredData = dataMutasi.filter(d => filterGender === "SEMUA" || d.gender === filterGender);

  return (
    <Protect permission="view_asrama">
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto min-h-screen">

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gold-500/10">
          <h1 className="text-3xl font-extrabold text-gold-500">Mutasi Sakan (Monitoring)</h1>
          <p className="text-gray-400 mt-1 font-medium">
            Daftar santri yang 3 duf'ah kebelakang berada di Sakan yang sama. Santri yang masih di sakan tersebut <span className="text-red-400 font-bold">wajib pindah</span>.
            <br />Dufah aktif saat ini: <span className="text-white font-bold">{dufahAktif}</span>
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-dark-800 rounded-2xl shadow-inner border border-gold-500/20 overflow-hidden mb-6">
          <div className="p-4 border-b border-gold-500/10 bg-dark-900/50 flex flex-col md:flex-row gap-4 justify-between items-center">

            <div className="flex bg-dark-800 p-1 rounded-xl border border-gold-500/20 shadow-inner w-full md:w-auto">
              <button
                onClick={() => setFilterGender('SEMUA')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterGender === 'SEMUA' ? 'bg-gold-500 text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterGender('BANIN')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-all ${filterGender === 'BANIN' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <IconMale /> Banin
              </button>
              <button
                onClick={() => setFilterGender('BANAT')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1 transition-all ${filterGender === 'BANAT' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <IconFemale /> Banat
              </button>
            </div>

            <div className="text-sm font-bold text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
              <span>Total: <span className="text-gold-500 font-extrabold">{filteredData.length}</span></span>
              <span>Belum Pindah: <span className="text-red-400 font-extrabold">{filteredData.filter((d: any) => !d.sudahDimutasi).length}</span></span>
              <span>Sudah Pindah: <span className="text-green-400 font-extrabold">{filteredData.filter((d: any) => d.sudahDimutasi).length}</span></span>
            </div>
          </div>

          {/* Table */}
          <div className="p-4 overflow-x-auto">
            {loading ? (
              <p className="text-center text-gray-500 py-10 font-bold animate-pulse">Memuat data...</p>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gold-500/10 text-gold-500 uppercase font-black text-xs">
                  <tr>
                    <th className="px-4 py-3 border-b border-gold-500/10 w-16 text-center">No</th>
                    <th className="px-4 py-3 border-b border-gold-500/10">Nama & NIS</th>
                    <th className="px-4 py-3 border-b border-gold-500/10 text-center w-28">Gender</th>
                    <th className="px-4 py-3 border-b border-gold-500/10">Sakan 3 Bln</th>
                    <th className="px-4 py-3 border-b border-gold-500/10">Posisi Sekarang</th>
                    <th className="px-4 py-3 border-b border-gold-500/10 w-28 text-center">Status</th>
                    <th className="px-4 py-3 border-b border-gold-500/10 w-32 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <IconHistory />
                          <p className="mt-3 font-medium">Tidak ada santri yang memenuhi kriteria mutasi.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item: any, index: number) => (
                      <tr key={index} className={`hover:bg-dark-900/50 transition-colors border-b border-gold-500/5 last:border-0 ${!item.sudahDimutasi ? 'bg-red-900/5' : ''}`}>
                        <td className="px-4 py-3 text-center text-gray-400 font-bold">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-200">{item.nama}</p>
                          <p className="text-xs text-gray-500 tracking-wider font-mono mt-0.5">{item.nis || "-"}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.gender === 'BANAT' ? (
                            <span className="text-pink-500 font-bold flex flex-col items-center gap-1 text-[10px] uppercase"><IconFemale /> Banat</span>
                          ) : (
                            <span className="text-blue-500 font-bold flex flex-col items-center gap-1 text-[10px] uppercase"><IconMale /> Banin</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-300 uppercase tracking-widest">{item.sakanLama}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold uppercase tracking-widest ${item.sudahDimutasi ? 'text-green-400' : 'text-red-400'}`}>{item.sakanSaatIni}</span>
                          {item.kamarSaatIni !== '-' && (
                            <p className="text-[10px] text-gray-500 mt-0.5">Km. {item.kamarSaatIni} / Lm. {item.lemariSaatIni}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.sudahDimutasi ? (
                            <span className="text-[10px] font-black px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">SUDAH PINDAH</span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">WAJIB PINDAH</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedRiwayat(item)}
                              className="flex items-center justify-center gap-2 w-full bg-dark-900 text-gold-500 border border-gold-500/30 hover:bg-gold-500 hover:text-black hover:border-gold-500 px-3 py-2 rounded-lg text-xs font-black transition-all active:scale-95 shadow-sm"
                            >
                              <IconHistory /> Riwayat
                            </button>
                            {item.sakanSaatIni === "Antrean (PRE_LIST)" && (
                              <button
                                onClick={() => router.push(`/admin/asrama?directRiwayatId=${item.riwayatId}`)}
                                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 hover:border-blue-400 px-3 py-2 rounded-lg text-xs font-black transition-all active:scale-95 shadow-sm"
                              >
                                Tempatkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* MODAL RIWAYAT */}
      {selectedRiwayat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-dark-800 rounded-2xl border border-gold-500/30 w-full max-w-lg shadow-2xl p-6 relative flex flex-col">

            <button
              onClick={() => setSelectedRiwayat(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-400 bg-dark-900 rounded-full p-2 transition-colors border border-transparent hover:border-red-500/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            <h2 className="text-xl font-black text-gold-500 mb-1">Riwayat Sakan</h2>
            <p className="text-gray-400 uppercase tracking-widest text-sm font-bold">{selectedRiwayat.nama}</p>
            <div className="h-px w-full bg-gold-500/20 my-4"></div>

            <div className="flex flex-col gap-3">
              {selectedRiwayat.riwayatDufah.map((r: any, i: number) => {
                const totalRiwayat = selectedRiwayat.riwayatDufah.length;
                const isCurrentMonth = i === totalRiwayat - 1;
                return (
                  <div key={i} className={`flex flex-col rounded-xl p-4 shadow-inner relative ${isCurrentMonth ? 'bg-red-900/30 border-2 border-red-500/50' : 'bg-dark-900 border border-gold-500/10'}`}>
                    <span className={`absolute top-0 right-0 text-[10px] font-black px-2 py-1 rounded-bl-xl rounded-tr-xl border-b border-l ${isCurrentMonth ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gold-500/10 text-gold-500 border-gold-500/10'}`}>
                      Sakan saat ini
                    </span>
                    <span className="text-xs font-bold text-gray-500 mb-1 leading-none">{r.dufah}</span>
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-lg font-black text-gray-200 uppercase tracking-widest leading-none">{r.sakan}</span>
                      <span className="text-xs text-gold-500 font-bold bg-dark-800 px-2 py-1 rounded border border-gold-500/20 shadow-sm leading-none">
                        Km. {r.kamar} / Lm. {r.lemari}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className={`text-center text-[11px] mt-6 font-bold ${selectedRiwayat.sudahDimutasi ? 'text-green-400' : 'text-red-400'}`}>
              {selectedRiwayat.sudahDimutasi 
                ? '✅ Santri ini sudah dipindahkan ke sakan lain / masuk antrean.' 
                : '⚠️ Santri ini masih berada di sakan yang sama! Sistem akan memblokir penempatan ulang di sakan ini dan otomatis memutasi saat duf\'ah baru diaktifkan.'}
            </p>

          </div>
        </div>
      )}
    </Protect>
  );
}
