import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function KeuanganPage() {
  const session: any = await getServerSession(authOptions)

  if (!session || session.user?.role !== "SANTRI") {
    redirect("/santri/login")
  }

  const santri = await prisma.santri.findUnique({
    where: { nis: session.user.username },
    include: {
      transaksi: {
        orderBy: { createdAt: 'desc' },
        include: {
          program: true
        }
      }
    }
  })

  if (!santri) return null;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka)
  }

  // Hitung statistik
  const totalTransaksi = santri.transaksi.length;
  const totalLunas = santri.transaksi.filter(t => t.statusPembayaran === 'PAID').length;
  const totalNominal = santri.transaksi.reduce((sum, t) => sum + t.totalTagihan, 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Riwayat <span className="text-gold-500">Keuangan</span></h1>
        <p className="text-gray-400 text-sm mt-1">Riwayat pembayaran pendaftaran dan daftar ulang.</p>
      </div>

      {/* Statistik Keuangan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-950 border border-dark-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Transaksi</p>
              <p className="text-2xl font-black text-white">{totalTransaksi}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-950 border border-dark-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Sudah Lunas</p>
              <p className="text-2xl font-black text-green-400">{totalLunas}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-950 border border-dark-800 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Nominal</p>
              <p className="text-xl font-black text-blue-400">{formatRupiah(totalNominal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-6 border-b border-dark-800 pb-3">
          <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="text-lg font-bold text-gold-500">Riwayat Pembayaran</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-dark-900 text-gold-500/70 text-sm font-bold">
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

      {/* Detail Kartu per Transaksi (Mobile-friendly) */}
      <div className="md:hidden space-y-4">
        {santri.transaksi.map((trx) => (
          <div key={`m-${trx.id}`} className="bg-dark-950 border border-dark-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-white">{trx.program.nama}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{trx.noKwitansi}</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${trx.statusPembayaran === 'PAID' ? 'bg-green-500/10 text-green-500 border border-green-500/30' :
                trx.statusPembayaran === 'KSU_GRATIS' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                }`}>
                  {trx.statusPembayaran === 'PAID' ? 'LUNAS' : trx.statusPembayaran}
              </span>
            </div>
            <div className="flex justify-between items-end border-t border-dark-800 pt-3">
              <p className="text-xs text-gray-500">{trx.createdAt.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-gold-400 font-black text-lg">{formatRupiah(trx.totalTagihan)}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
