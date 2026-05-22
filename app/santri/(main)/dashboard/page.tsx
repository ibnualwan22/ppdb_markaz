import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import AgendaRutinan from "@/app/components/AgendaRutinan"

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
        take: 1,
        include: {
          lemari: { include: { kamar: { include: { sakan: true } } } },
          dufah: true
        }
      }
    }
  })

  if (!santri) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Data Tidak Ditemukan</h2>
        <p className="text-gray-400 mb-6">NIS Anda tidak terdaftar di dalam database kami.</p>
        <Link href="/santri/login" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl">Kembali</Link>
      </div>
    )
  }

  const latestRiwayat = santri.riwayat[0]
  const lokasi = latestRiwayat?.lemari
    ? `${latestRiwayat.lemari.kamar.sakan.nama} • Kamar ${latestRiwayat.lemari.kamar.nama} • Lemari ${latestRiwayat.lemari.nomor}`
    : "Belum Ditempatkan"

  let aktifSampaiStr = `Duf'ah ${santri.batasAktifDufah}`;
  if (santri.batasAktifDufah) {
    const targetDufah = await prisma.dufah.findUnique({
      where: { id: santri.batasAktifDufah }
    });

    if (targetDufah) {
      aktifSampaiStr = targetDufah.nama;
    } else {
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

  let siakadDataActive: any = null;
  try {
    const res = await fetch(`https://siakad.markazarabiyah.site/api/santri/${santri.id}/riwayat`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.riwayat && json.riwayat.length > 0) {
        // Asumsikan data pertama (reverse) adalah dufah terakhir/aktif
        siakadDataActive = json.riwayat.reverse()[0];
      }
    }
  } catch (error) {
    console.warn("Info: Gagal mengambil data akademik dari Siakad.");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Dashboard <span className="text-gold-500">Santri</span></h1>
        <p className="text-gray-400 text-sm mt-1">Ahlan wa sahlan, {santri.nama}!</p>
      </div>

      {!santri.isAktif && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-red-500 font-bold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

      {!santri.isDataVerified && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-amber-500 font-bold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Verifikasi Data Diri Syahadah ⚠️
            </h3>
            <p className="text-amber-300 text-sm mt-1">
              <strong>PENTING:</strong> Harap verifikasi data diri Anda untuk syahadah. Update data hanya bisa dilakukan <strong>SATU KALI</strong>. Pastikan penulisan sudah benar sesuai Kartu Keluarga (KK)!
            </p>
          </div>
          <Link href="/santri/verifikasi-data" className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 px-6 rounded-xl shadow-md whitespace-nowrap transition-colors">
            Verifikasi Sekarang
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kartu Profil Utama */}
        <div className="md:col-span-2 bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-bl-full pointer-events-none" />

          <div className="flex justify-between items-center mb-6 border-b border-dark-800 pb-3">
            <h2 className="text-lg font-bold text-gold-500">Profil Aktif</h2>
            {santri.isDataVerified ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Terverifikasi
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                ⚠️ Belum Validasi
              </span>
            )}
          </div>

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
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-dark-800 pt-4 mt-4">
              <div className="col-span-2 md:col-span-1">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tempat, Tanggal Lahir</p>
                <p className="text-sm font-bold text-gray-200">
                  {santri.tempatLahir || "-"}, {santri.tanggalLahir ? new Date(santri.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No. WA Santri</p>
                <p className="text-sm font-bold text-gray-200">{santri.noWaSantri || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No. WA Orang Tua</p>
                <p className="text-sm font-bold text-gray-200">{santri.noWaOrtu || "-"}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nama Orang Tua</p>
                <p className="text-sm font-bold text-gray-200">{santri.namaOrtu || "-"}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Alamat Lengkap</p>
                <p className="text-sm font-bold text-gray-200 leading-relaxed">
                  {santri.detailAlamat ? `${santri.detailAlamat}, ` : ''}
                  {santri.desa ? `${santri.desa}, ` : ''}
                  {santri.kecamatan ? `${santri.kecamatan}, ` : ''}
                  {santri.kabupaten ? `${santri.kabupaten}, ` : ''}
                  {santri.provinsi || "-"}
                </p>
              </div>
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
            <h2 className="text-sm font-bold text-gold-400 mb-2 uppercase tracking-widest">Sakan Saat Ini</h2>
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

      {/* Ringkasan Akademik Dufah Aktif */}
      {siakadDataActive && (
        <div className="bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-dark-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gold-500">Akademik {siakadDataActive.dufah}</h2>
              <p className="text-gray-400 text-sm mt-0.5">{siakadDataActive.akademik?.program} &bull; {siakadDataActive.akademik?.kelas}</p>
            </div>
            <Link href="/santri/akademik" className="px-4 py-2 bg-dark-900 hover:bg-dark-800 text-gray-300 rounded-lg text-sm font-bold border border-dark-700 transition-colors">
              Lihat Lengkap
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabel Nilai Singkat */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nilai Akhir Ujian</h4>
              {(!siakadDataActive.nilai_per_mapel || siakadDataActive.nilai_per_mapel.length === 0) ? <p className="text-sm text-gray-600 italic">Belum ada nilai.</p> : (
                <div className="overflow-x-auto rounded-lg border border-dark-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dark-900 text-gold-500/70">
                        <th className="text-left p-3 font-bold">Mata Pelajaran</th>
                        <th className="text-center p-3 font-bold">Nilai Akhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siakadDataActive.nilai_per_mapel.map((n: any, ni: number) => (
                        <tr key={ni} className="border-t border-dark-800">
                          <td className="p-3 text-gray-300 font-medium">{n.mapel}</td>
                          <td className="p-3 text-center font-bold text-white">{n.nilai_akhir ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Rekap Absensi Singkat */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rekap Kehadiran (Kelas)</h4>
              {(!siakadDataActive.rekap_absen_kelas) ? <p className="text-sm text-gray-600 italic">Belum ada data kehadiran.</p> : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-dark-900 p-4 rounded-lg border border-dark-800 flex justify-between items-center">
                    <span className="text-gray-400 font-bold">Hadir</span>
                    <span className="text-green-400 font-black text-xl">{siakadDataActive.rekap_absen_kelas.total_hadir}</span>
                  </div>
                  <div className="bg-dark-900 p-4 rounded-lg border border-dark-800 flex justify-between items-center">
                    <span className="text-gray-400 font-bold">Izin</span>
                    <span className="text-blue-400 font-black text-xl">{siakadDataActive.rekap_absen_kelas.total_izin}</span>
                  </div>
                  <div className="bg-dark-900 p-4 rounded-lg border border-dark-800 flex justify-between items-center">
                    <span className="text-gray-400 font-bold">Sakit</span>
                    <span className="text-amber-400 font-black text-xl">{siakadDataActive.rekap_absen_kelas.total_sakit}</span>
                  </div>
                  <div className="bg-dark-900 p-4 rounded-lg border border-dark-800 flex justify-between items-center">
                    <span className="text-gray-400 font-bold">Alpha</span>
                    <span className="text-red-400 font-black text-xl">{siakadDataActive.rekap_absen_kelas.total_alpha}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rincian Absensi */}
          <div className="mt-6 border-t border-dark-800 pt-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Rincian Absensi (Izin / Sakit / Alpha)</h4>
            {(() => {
              const detailAbsen = siakadDataActive.detail_absen_kelas || siakadDataActive.rekap_absen_kelas?.detail || siakadDataActive.absen_harian || siakadDataActive.detail_absen;
              if (!detailAbsen || detailAbsen.length === 0) {
                return <p className="text-sm text-gray-600 italic">Belum ada rincian absensi yang tercatat.</p>;
              }
              return (
                <div className="overflow-x-auto rounded-lg border border-dark-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dark-900 text-gold-500/70">
                        <th className="text-left p-3 font-bold whitespace-nowrap">Tanggal</th>
                        <th className="text-center p-3 font-bold">Status</th>
                        <th className="text-left p-3 font-bold">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailAbsen.map((abs: any, idx: number) => {
                        const status = (abs.status || '').toUpperCase();
                        const statusCls = status === 'HADIR' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                                          status === 'IZIN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 
                                          status === 'SAKIT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                                          'bg-red-500/10 text-red-400 border-red-500/30';
                        return (
                          <tr key={idx} className="border-t border-dark-800">
                            <td className="p-3 text-gray-300 font-medium whitespace-nowrap">
                              {abs.tanggal ? new Date(abs.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusCls}`}>
                                {status || '-'}
                              </span>
                            </td>
                            <td className="p-3 text-gray-400 text-xs">{abs.catatan || abs.keterangan || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Komponen Agenda Rutinan */}
      <div className="bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm">
        <AgendaRutinan />
      </div>

    </>
  )
}
