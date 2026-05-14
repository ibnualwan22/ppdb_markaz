import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AsramaPage() {
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
      }
    }
  })

  if (!santri) return null;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Riwayat <span className="text-gold-500">Asrama</span></h1>
        <p className="text-gray-400 text-sm mt-1">Riwayat penempatan sakan dari awal masuk hingga saat ini.</p>
      </div>

      {/* Timeline Riwayat Sakan */}
      <div className="bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-6 border-b border-dark-800 pb-3">
          <svg className="w-5 h-5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-lg font-bold text-gold-500">Histori Penempatan</h2>
        </div>

        {santri.riwayat.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic border border-dashed border-dark-800 rounded-xl">
            Belum ada riwayat penempatan asrama.
          </div>
        ) : (
          <div className="space-y-4">
            {santri.riwayat.map((r, index) => {
              const isFirst = index === 0;
              const statusColor = (r.status === 'ASSIGNED' || r.status === 'CHECKED_IN')
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/30';

              return (
                <div key={r.id} className={`relative rounded-xl border overflow-hidden transition-all ${isFirst ? 'border-gold-500/30 bg-gradient-to-r from-dark-900 to-dark-950' : 'border-dark-800 bg-dark-900'}`}>
                  {isFirst && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gold-500 rounded-l-xl" />
                  )}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isFirst ? 'bg-gold-500/10 text-gold-500' : 'bg-dark-800 text-gray-500'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`font-black text-base ${isFirst ? 'text-gold-500' : 'text-white'}`}>
                          {r.dufah.nama}
                          {isFirst && <span className="ml-2 text-xs font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full border border-gold-500/20">Aktif</span>}
                        </h3>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-sm text-gray-300">
                            <span className="text-gray-500 font-bold">Sakan:</span> {r.lemari?.kamar?.sakan?.nama || "-"}
                          </p>
                          <p className="text-sm text-gray-300">
                            <span className="text-gray-500 font-bold">Kamar:</span> {r.lemari?.kamar?.nama || "-"}
                          </p>
                          <p className="text-sm text-gray-300">
                            <span className="text-gray-500 font-bold">Lemari:</span> {r.lemari?.nomor || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="md:text-right shrink-0">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabel Ringkasan */}
      <div className="bg-dark-950 border border-dark-800 p-6 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold text-gold-500 mb-4 border-b border-dark-800 pb-3">Tabel Ringkasan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead className="bg-dark-900 text-gold-500/70 text-sm font-bold">
              <tr>
                <th className="p-4 rounded-tl-xl">Duf&apos;ah</th>
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
    </>
  )
}
