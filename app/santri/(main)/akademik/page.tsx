import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AkademikPage() {
  const session: any = await getServerSession(authOptions)

  if (!session || session.user?.role !== "SANTRI") {
    redirect("/santri/login")
  }

  const santri = await prisma.santri.findUnique({
    where: { nis: session.user.username },
    select: { id: true, nama: true }
  })

  if (!santri) return null;

  let siakadData: any = [];
  try {
    const res = await fetch(`https://siakad.markazarabiyah.site/api/santri/${santri.id}/riwayat`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        siakadData = (json.riwayat || []).reverse();
      }
    }
  } catch (error) {
    console.warn("Info: Gagal mengambil data akademik dari Siakad.");
  }

  const fmtTgl = (d: string) => { try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Akademik <span className="text-gold-500">Santri</span></h1>
        <p className="text-gray-400 text-sm mt-1">Transkrip akademik dan rekapitulasi kehadiran.</p>
      </div>

      <div className="bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-dark-800 pb-3">
          <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <h2 className="text-lg font-bold text-gold-500">Histori Akademik</h2>
        </div>
        {(!siakadData || siakadData.length === 0) ? (
          <div className="p-8 text-center text-gray-500 italic border border-dashed border-dark-800 rounded-xl">Belum ada data akademik dari SIAKAD.</div>
        ) : (
          <div className="space-y-6">
            {siakadData.map((aka: any, idx: number) => {
              const statusCls = (s: string) => s === 'HADIR' ? 'bg-green-500/10 text-green-400' : s === 'IZIN' ? 'bg-blue-500/10 text-blue-400' : s === 'SAKIT' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400';
              return (
              <div key={idx} className="rounded-xl border border-dark-800 overflow-hidden">
                {/* Header Dufah */}
                <div className="bg-dark-900 px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-black text-white">{aka.dufah}</h3>
                    <p className="text-gold-400 text-sm font-semibold mt-0.5">{aka.akademik?.program} &bull; {aka.akademik?.kelas}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {aka.akademik?.is_tasmi && <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase">Tasmi&apos;</span>}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${aka.akademik?.status_kelulusan === 'LULUS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : aka.akademik?.status_kelulusan === 'TIDAK_LULUS' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{aka.akademik?.status_kelulusan?.replace('_',' ') || 'BERJALAN'}</span>
                  </div>
                </div>

                {/* Tabel Nilai */}
                <div className="p-5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nilai Ujian</h4>
                  {(!aka.nilai_per_mapel || aka.nilai_per_mapel.length === 0) ? <p className="text-sm text-gray-600 italic">Belum ada nilai.</p> : (
                  <div className="overflow-x-auto rounded-lg border border-dark-800">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-dark-900 text-gold-500/70">
                        <th className="text-left p-3 font-bold">Mata Pelajaran</th>
                        <th className="text-center p-3 font-bold">Usbu&apos; 1</th>
                        <th className="text-center p-3 font-bold">Usbu&apos; 2</th>
                        <th className="text-center p-3 font-bold">Nihai</th>
                        <th className="text-center p-3 font-bold">Akhir</th>
                      </tr></thead>
                      <tbody>{aka.nilai_per_mapel.map((n: any, ni: number) => (
                        <tr key={ni} className={`border-t border-dark-800 ${ni % 2 === 0 ? 'bg-dark-900/50' : ''}`}>
                          <td className="p-3 text-gray-300 font-medium">{n.mapel}</td>
                          <td className="p-3 text-center font-bold text-gold-400">{n.nilai_usbu_1 ?? '-'}</td>
                          <td className="p-3 text-center font-bold text-gold-400">{n.nilai_usbu_2 ?? '-'}</td>
                          <td className="p-3 text-center font-bold text-gold-400">{n.nilai_nihai ?? '-'}</td>
                          <td className="p-3 text-center font-bold text-white">{n.nilai_akhir ?? '-'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>)}
                </div>

                {/* Kartu Rekap Keseluruhan */}
                <div className="px-5 pb-5">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rekap Kehadiran Keseluruhan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[{key:'rekap_absen_kelas',label:'Kelas'},{key:'rekap_absen_sakan',label:'Sakan'},{key:'rekap_absen_kegiatan',label:'Kegiatan'}].map(cat => {
                      const r = aka[cat.key];
                      return (
                      <div key={cat.key} className="bg-dark-900 p-4 rounded-lg border border-dark-800">
                        <p className="text-[10px] font-bold text-gold-500 uppercase tracking-wider mb-3">{cat.label}</p>
                        {!r ? <p className="text-xs text-gray-600 italic">Belum ada data</p> : (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between"><span className="text-gray-500">Hadir</span><span className="font-bold text-green-400">{r.total_hadir}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Izin</span><span className="font-bold text-blue-400">{r.total_izin}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Sakit</span><span className="font-bold text-amber-400">{r.total_sakit}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Alpha</span><span className="font-bold text-red-400">{r.total_alpha}</span></div>
                          <div className="col-span-2 pt-2 border-t border-dark-800 flex justify-between"><span className="text-gray-500">Total Hari</span><span className="font-bold text-white">{r.total_hari}</span></div>
                        </div>)}
                      </div>);
                    })}
                  </div>
                </div>

              </div>
            );})}</div>
        )}
      </div>
    </>
  )
}
