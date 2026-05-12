import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "./LogoutButton"

export default async function SantriDashboardPage() {
  const session: any = await getServerSession(authOptions)

  if (!session || session.user?.role !== "SANTRI") {
    redirect("/santri/login")
  }

  const santri = await prisma.santri.findUnique({
    where: { nis: session.user.username },
    include: {
      riwayat: {
        orderBy: { dufahId: 'desc' },
        include: {
          lemari: { include: { kamar: { include: { sakan: true } } } },
          dufah: true
        }
      },
      transaksi: {
        orderBy: { createdAt: 'desc' },
        include: {
          program: true
        }
      }
    }
  })

  if (!santri) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Data Tidak Ditemukan</h2>
        <p className="text-gray-400 mb-6">NIS Anda tidak terdaftar di dalam database kami.</p>
        <LogoutButton />
      </div>
    )
  }

  const latestRiwayat = santri.riwayat[0]
  const lokasi = latestRiwayat?.lemari
    ? `${latestRiwayat.lemari.kamar.sakan.nama} • Kamar ${latestRiwayat.lemari.kamar.nama} • Lemari ${latestRiwayat.lemari.nomor}`
    : "Belum Ditempatkan"

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka)
  }

  let aktifSampaiStr = `Duf'ah ${santri.batasAktifDufah}`;
  if (santri.batasAktifDufah) {
    const targetDufah = await prisma.dufah.findUnique({
      where: { id: santri.batasAktifDufah }
    });

    if (targetDufah) {
      aktifSampaiStr = targetDufah.nama;
    } else {
      // Jika dufah masa depan belum dibuat di database, hitung secara matematis
      const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
      if (dufahAktif) {
        const offset = santri.batasAktifDufah - dufahAktif.id;
        const match = dufahAktif.nama.match(/\d+/);
        if (match) {
          const currentNum = parseInt(match[0], 10);
          aktifSampaiStr = `Duf'ah ${currentNum + offset}`;
        }
      }
    }
  }
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
    // Gunakan console.log/warn agar tidak men-trigger error overlay di Next.js saat domain belum tersedia
    console.warn("Info: Gagal mengambil data akademik dari Siakad (mungkin API belum siap atau offline).");
  }
  const fmtTgl = (d: string) => { try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-900 border border-gold-500/20 p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-white">Portal <span className="text-gold-500">Santri</span></h1>
            <p className="text-gray-400 text-sm mt-1">Ahlan wa sahlan, pantau data akademik dan asrama Anda.</p>
          </div>
          <LogoutButton />
        </div>

        {/* Notifikasi Inaktif */}
        {!santri.isAktif && (
          <div className="bg-red-500/10 border-l-4 border-red-500 p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-red-500 font-bold text-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Status Santri: TIDAK AKTIF
              </h3>
              <p className="text-red-300 text-sm mt-1">Nomor Induk Santri (NIS) Anda saat ini berstatus tidak aktif. Anda tidak akan mendapatkan penempatan asrama baru sebelum melakukan Daftar Ulang.</p>
            </div>
            <Link href="/daftar-ulang" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-md whitespace-nowrap transition-colors">
              Mulai Daftar Ulang
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kartu Profil Utama */}
          <div className="md:col-span-2 bg-dark-900 border border-gold-500/20 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-bl-full pointer-events-none" />

            <h2 className="text-lg font-bold text-gold-500 mb-6 border-b border-gold-500/20 pb-3">Profil Santri</h2>

            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nama Lengkap</p>
                <p className="text-xl font-black text-white">{santri.nama}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">NIS</p>
                  <p className="text-sm font-bold text-gray-200">{santri.nis || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gender</p>
                  <p className="text-sm font-bold text-gray-200">{santri.gender}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Kategori</p>
                  <p className="text-sm font-bold text-gray-200">{santri.kategori}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tempat Lahir</p>
                  <p className="text-sm font-bold text-gray-200">{santri.tempatLahir || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tanggal Lahir</p>
                  <p className="text-sm font-bold text-gray-200">{santri.tanggalLahir ? new Date(santri.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nama Orang Tua</p>
                  <p className="text-sm font-bold text-gray-200">{santri.namaOrtu || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No. WA Santri</p>
                  <p className="text-sm font-bold text-gray-200">{santri.noWaSantri || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No. WA Ortu</p>
                  <p className="text-sm font-bold text-gray-200">{santri.noWaOrtu || "-"}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-dark-800">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Alamat Domisili</p>
                <p className="text-sm font-bold text-gray-200 leading-relaxed">
                  {santri.detailAlamat ? `${santri.detailAlamat}, ` : ''}
                  {santri.desa ? `Desa ${santri.desa}, ` : ''}
                  {santri.kecamatan ? `Kec. ${santri.kecamatan}, ` : ''}
                  {santri.kabupaten ? `${santri.kabupaten}, ` : ''}
                  {santri.provinsi || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Kartu Lokasi Asrama */}
          <div className="bg-gradient-to-br from-dark-900 to-dark-800 border border-gold-500/30 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-4 right-4 text-gold-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 12h3v8h14v-8h3L12 2z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-sm font-bold text-gold-400 mb-2 uppercase tracking-widest">Penempatan Asrama</h2>
              <div className="bg-dark-950/50 p-4 rounded-xl border border-dark-700 backdrop-blur-sm">
                <p className="text-white font-bold text-lg leading-snug">{lokasi}</p>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Dufah Saat Ini</p>
                  <p className="text-gold-500 font-black text-xl">{latestRiwayat?.dufah.nama || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Aktif Sampai</p>
                  <p className="text-gray-300 font-bold">{aktifSampaiStr}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-dark-900 border border-gold-500/20 p-6 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-gold-500/20 pb-3">
            <h2 className="text-lg font-bold text-gold-500">Riwayat Pembayaran</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-dark-950 text-gold-500/70 text-sm font-bold">
                <tr>
                  <th className="p-4 rounded-tl-xl">Tanggal</th>
                  <th className="p-4">No. Kwitansi</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 text-center rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {santri.transaksi.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">Belum ada riwayat transaksi.</td>
                  </tr>
                ) : (
                  santri.transaksi.map((trx) => (
                    <tr key={trx.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                      <td className="p-4 text-sm">{trx.createdAt.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                      <td className="p-4 font-mono text-sm text-gray-400">{trx.noKwitansi}</td>
                      <td className="p-4 font-bold">{trx.program.nama}</td>
                      <td className="p-4 font-bold text-gold-400">{formatRupiah(trx.totalTagihan)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${trx.statusPembayaran === 'PAID' ? 'bg-green-500/10 text-green-500 border border-green-500/30' :
                          trx.statusPembayaran === 'KSU_GRATIS' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                            'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                          }`}>
                          {trx.statusPembayaran === 'PAID' ? 'LUNAS' : trx.statusPembayaran}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riwayat Sakan */}
        <div className="bg-dark-900 border border-gold-500/20 p-6 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-gold-500/20 pb-3">
            <h2 className="text-lg font-bold text-gold-500">Riwayat Sakan / Asrama</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-dark-950 text-gold-500/70 text-sm font-bold">
                <tr>
                  <th className="p-4 rounded-tl-xl">Duf'ah</th>
                  <th className="p-4">Sakan</th>
                  <th className="p-4">Kamar</th>
                  <th className="p-4">Lemari</th>
                  <th className="p-4 text-center rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {santri.riwayat.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">Belum ada riwayat asrama.</td>
                  </tr>
                ) : (
                  santri.riwayat.map((r) => (
                    <tr key={r.id} className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors">
                      <td className="p-4 font-bold">{r.dufah.nama}</td>
                      <td className="p-4 text-sm">{r.lemari?.kamar?.sakan?.nama || "-"}</td>
                      <td className="p-4 text-sm">{r.lemari?.kamar?.nama || "-"}</td>
                      <td className="p-4 text-sm">{r.lemari?.nomor || "-"}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${r.status === 'ASSIGNED' || r.status === 'CHECKED_IN' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-gray-500/10 text-gray-400 border border-gray-500/30'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riwayat Akademik */}
        <div className="bg-dark-900 border border-gold-500/20 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-gold-500/20 pb-3">
            <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <h2 className="text-lg font-bold text-gold-500">Transkrip Akademik</h2>
          </div>
          {(!siakadData || siakadData.length === 0) ? (
            <div className="p-8 text-center text-gray-500 italic border border-dashed border-dark-700 rounded-xl">Belum ada data akademik dari SIAKAD.</div>
          ) : (
            <div className="space-y-6">
              {siakadData.map((aka: any, idx: number) => {
                const statusCls = (s: string) => s === 'HADIR' ? 'bg-green-500/10 text-green-400' : s === 'IZIN' ? 'bg-blue-500/10 text-blue-400' : s === 'SAKIT' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400';
                return (
                <div key={idx} className="rounded-xl border border-dark-700 overflow-hidden">
                  {/* Header Dufah */}
                  <div className="bg-dark-950 px-5 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h3 className="text-base font-black text-white">{aka.dufah}</h3>
                      <p className="text-gold-400 text-sm font-semibold mt-0.5">{aka.akademik?.program} &bull; {aka.akademik?.kelas}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {aka.akademik?.is_tasmi && <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase">Tasmi&apos;</span>}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${aka.akademik?.status_kelulusan === 'LULUS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : aka.akademik?.status_kelulusan === 'TIDAK_LULUS' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{aka.akademik?.status_kelulusan?.replace('_',' ') || 'BERJALAN'}</span>
                    </div>
                  </div>

                  {/* Tabel Nilai: Mapel | Usbu 1 | Usbu 2 | Nihai | Akhir */}
                  <div className="p-5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nilai Ujian</h4>
                    {(!aka.nilai_per_mapel || aka.nilai_per_mapel.length === 0) ? <p className="text-sm text-gray-600 italic">Belum ada nilai.</p> : (
                    <div className="overflow-x-auto rounded-lg border border-dark-700">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-dark-950 text-gold-500/70">
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

                  {/* Rekap Absensi Per Usbu */}
                  <div className="px-5 pb-5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rekap Absensi Per Usbu&apos;</h4>
                    {(!aka.rekap_absen_per_usbu || aka.rekap_absen_per_usbu.length === 0) ? <p className="text-sm text-gray-600 italic">Belum ada rekap.</p> : (
                    <div className="overflow-x-auto rounded-lg border border-dark-700">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-dark-950 text-gold-500/70">
                          <th className="text-left p-3 font-bold">Usbu&apos;</th>
                          <th className="text-center p-3 font-bold text-green-500">Hadir</th>
                          <th className="text-center p-3 font-bold text-blue-400">Izin</th>
                          <th className="text-center p-3 font-bold text-amber-400">Sakit</th>
                          <th className="text-center p-3 font-bold text-red-400">Alpha</th>
                          <th className="text-center p-3 font-bold text-gold-400">Rata-rata</th>
                        </tr></thead>
                        <tbody>{aka.rekap_absen_per_usbu.map((a: any, ai: number) => (
                          <tr key={ai} className={`border-t border-dark-800 ${ai % 2 === 0 ? 'bg-dark-900/50' : ''}`}>
                            <td className="p-3 text-gray-300 font-medium">Usbu&apos; {a.usbu}</td>
                            <td className="p-3 text-center font-bold text-green-400">{a.total_hadir}</td>
                            <td className="p-3 text-center font-bold text-blue-400">{a.total_izin}</td>
                            <td className="p-3 text-center font-bold text-amber-400">{a.total_sakit}</td>
                            <td className="p-3 text-center font-bold text-red-400">{a.total_alpha}</td>
                            <td className="p-3 text-center font-bold text-gold-400">{a.rata_rata_nilai ?? '-'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>)}
                  </div>

                  {/* Kartu Rekap Keseluruhan: Kelas / Sakan / Kegiatan */}
                  <div className="px-5 pb-5">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rekap Kehadiran Keseluruhan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[{key:'rekap_absen_kelas',label:'Kelas'},{key:'rekap_absen_sakan',label:'Sakan'},{key:'rekap_absen_kegiatan',label:'Kegiatan'}].map(cat => {
                        const r = aka[cat.key];
                        return (
                        <div key={cat.key} className="bg-dark-950 p-4 rounded-lg border border-dark-800">
                          <p className="text-[10px] font-bold text-gold-500 uppercase tracking-wider mb-3">{cat.label}</p>
                          {!r ? <p className="text-xs text-gray-600 italic">Belum ada data</p> : (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">Hadir</span><span className="font-bold text-green-400">{r.total_hadir}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Izin</span><span className="font-bold text-blue-400">{r.total_izin}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Sakit</span><span className="font-bold text-amber-400">{r.total_sakit}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Alpha</span><span className="font-bold text-red-400">{r.total_alpha}</span></div>
                            <div className="col-span-2 pt-2 border-t border-dark-700 flex justify-between"><span className="text-gray-500">Total Hari</span><span className="font-bold text-white">{r.total_hari}</span></div>
                          </div>)}
                        </div>);
                      })}
                    </div>
                  </div>

                  {/* Rincian Histori Absen — Tabel per Kategori */}
                  {aka.histori_absen && (
                  <div className="px-5 pb-5 pt-3 border-t border-dark-800 space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rincian Kehadiran</h4>
                    {/* Absen Kelas */}
                    {aka.histori_absen.kelas?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gold-500 uppercase tracking-wider mb-2">Kelas</p>
                      <div className="overflow-x-auto rounded-lg border border-dark-700 max-h-60 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0"><tr className="bg-dark-950 text-gold-500/70">
                            <th className="text-left p-2 font-bold">Tanggal</th><th className="text-left p-2 font-bold">Sesi</th><th className="text-center p-2 font-bold">Status</th><th className="text-left p-2 font-bold">Ket.</th>
                          </tr></thead>
                          <tbody>{aka.histori_absen.kelas.map((h: any, i: number) => (
                            <tr key={i} className={`border-t border-dark-800 ${h.status === 'ALPHA' ? 'bg-red-500/5' : ''}`}>
                              <td className="p-2 text-gray-400">{fmtTgl(h.tanggal)}</td>
                              <td className="p-2 text-gray-300">{h.sesi?.replace('_',' ') || '-'}</td>
                              <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls(h.status)}`}>{h.status}</span></td>
                              <td className="p-2 text-gray-400">{h.keterangan || '-'}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>)}
                    {/* Absen Sakan */}
                    {aka.histori_absen.sakan?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gold-500 uppercase tracking-wider mb-2">Sakan</p>
                      <div className="overflow-x-auto rounded-lg border border-dark-700 max-h-60 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0"><tr className="bg-dark-950 text-gold-500/70">
                            <th className="text-left p-2 font-bold">Tanggal</th><th className="text-center p-2 font-bold">Status</th><th className="text-left p-2 font-bold">Ket.</th>
                          </tr></thead>
                          <tbody>{aka.histori_absen.sakan.map((h: any, i: number) => (
                            <tr key={i} className={`border-t border-dark-800 ${h.status === 'ALPHA' ? 'bg-red-500/5' : ''}`}>
                              <td className="p-2 text-gray-400">{fmtTgl(h.tanggal)}</td>
                              <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls(h.status)}`}>{h.status}</span></td>
                              <td className="p-2 text-gray-400">{h.keterangan || '-'}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>)}
                    {/* Absen Kegiatan */}
                    {aka.histori_absen.kegiatan?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gold-500 uppercase tracking-wider mb-2">Kegiatan</p>
                      <div className="overflow-x-auto rounded-lg border border-dark-700 max-h-60 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0"><tr className="bg-dark-950 text-gold-500/70">
                            <th className="text-left p-2 font-bold">Tanggal</th><th className="text-left p-2 font-bold">Kegiatan</th><th className="text-center p-2 font-bold">Status</th><th className="text-left p-2 font-bold">Ket.</th>
                          </tr></thead>
                          <tbody>{aka.histori_absen.kegiatan.map((h: any, i: number) => (
                            <tr key={i} className={`border-t border-dark-800 ${h.status === 'ALPHA' ? 'bg-red-500/5' : ''}`}>
                              <td className="p-2 text-gray-400">{fmtTgl(h.tanggal)}</td>
                              <td className="p-2 text-gray-300">{h.nama_kegiatan || '-'}</td>
                              <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls(h.status)}`}>{h.status}</span></td>
                              <td className="p-2 text-gray-400">{h.keterangan || '-'}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>)}
                  </div>)}
                </div>
              );})}</div>
          )}
        </div>

      </div>
    </div>
  )
}
