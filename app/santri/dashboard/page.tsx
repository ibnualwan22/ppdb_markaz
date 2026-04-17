import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "./LogoutButton"

const prisma = new PrismaClient()

export default async function SantriDashboardPage() {
  const session: any = await getServerSession(authOptions)

  if (!session || session.user?.role !== "SANTRI") {
    redirect("/santri/login")
  }

  const santri = await prisma.santri.findUnique({
    where: { nis: session.user.username },
    include: {
      riwayat: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">NIS</p>
                  <p className="text-lg font-bold text-gray-200">{santri.nis || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Gender</p>
                  <p className="text-lg font-bold text-gray-200">{santri.gender}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Kategori</p>
                  <p className="text-lg font-bold text-gray-200">{santri.kategori}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">No. WhatsApp</p>
                  <p className="text-lg font-bold text-gray-200">{santri.noWaSantri || santri.noWaOrtu || "-"}</p>
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
                  <p className="text-gray-300 font-bold">Duf'ah {santri.batasAktifDufah}</p>
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

      </div>
    </div>
  )
}
