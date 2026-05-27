const fs = require('fs');

let content = fs.readFileSync('app/admin/pendaftaran/page.tsx', 'utf8');

// Imports
content = content.replace(
  'import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from \'recharts\';',
  `import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import * as XLSX from 'xlsx';`
);

// State
content = content.replace(
  'const [allDufah, setAllDufah] = useState<any[]>([]);',
  `const [allDufah, setAllDufah] = useState<any[]>([]);
  const [allRombongan, setAllRombongan] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  
  // Rombongan Upload Modal State
  const [isRombonganModalOpen, setIsRombonganModalOpen] = useState(false);
  const [rombonganFile, setRombonganFile] = useState<File | null>(null);
  const [namaRombongan, setNamaRombongan] = useState("");
  const [isMouSigned, setIsMouSigned] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [parsedRombonganData, setParsedRombonganData] = useState<any[]>([]);`
);

// API Fetch
content = content.replace(
  'setDaftarUlang(data.daftarUlang || []);',
  `setDaftarUlang(data.daftarUlang || []);
        setAllRombongan(data.allRombongan || []);
        setPrograms(data.programs || []);`
);

// Verifikasi Rombongan Function
content = content.replace(
  'const batalkanDaftarUlang = async (id: string) => {',
  `const prosesVerifikasiRombongan = async (id: string) => {
    if (!confirm("Yakin ingin memverifikasi pelunasan seluruh rombongan ini?")) return;
    setLoading(true);
    try {
      const adminId = (session?.user as any)?.id;
      const res = await fetch(\`/api/admin/keuangan/rombongan/\${id}/verifikasi\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId })
      });
      const data = await res.json();
      if (res.ok) {
        swalSuccess("Berhasil", "Rombongan berhasil diverifikasi lunas.");
        muatData();
      } else {
        swalError("Gagal", data.error || "Gagal memverifikasi");
      }
    } catch (e) {
      swalError("Error", "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setRombonganFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setParsedRombonganData(data);
    };
    reader.readAsBinaryString(file);
  };

  const submitRombongan = async () => {
    if (!namaRombongan || !selectedProgramId || parsedRombonganData.length === 0) {
      return swalError("Gagal", "Nama rombongan, program, dan file Excel harus diisi.");
    }
    setLoading(true);
    try {
      // Map keys from excel to expected keys
      const santris = parsedRombonganData.map((row: any) => ({
        nama: row.Nama || row.nama || "",
        gender: row.Gender || row.gender || "BANIN",
        tempatLahir: row.TempatLahir || row.tempatLahir || "",
        tanggalLahir: row.TanggalLahir || row.tanggalLahir || null, // Excel date parsing might be needed depending on format, assuming string for now
        namaOrtu: row.NamaOrtu || row.namaOrtu || "",
        noWaOrtu: row.NoWaOrtu || row.noWaOrtu || "",
        provinsi: row.Provinsi || row.provinsi || "",
        kabupaten: row.Kabupaten || row.kabupaten || "",
        kecamatan: row.Kecamatan || row.kecamatan || "",
        desa: row.Desa || row.desa || "",
        detailAlamat: row.DetailAlamat || row.detailAlamat || "",
      })).filter(s => s.nama); // minimal ada nama

      const res = await fetch('/api/admin/keuangan/rombongan', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaRombongan,
          isMouSigned,
          programId: selectedProgramId,
          santris
        })
      });

      const data = await res.json();
      if (res.ok) {
        swalSuccess("Berhasil", "Rombongan berhasil diimport.");
        setIsRombonganModalOpen(false);
        setRombonganFile(null);
        setParsedRombonganData([]);
        setNamaRombongan("");
        setIsMouSigned(false);
        muatData();
      } else {
        swalError("Gagal", data.error || "Gagal import rombongan");
      }
    } catch (e) {
      swalError("Error", "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const batalkanDaftarUlang = async (id: string) => {`
);


// Calculate metrics update
// We need to exclude TransaksiPendaftaran that have rombonganId from the normal list so they don't double count?
// Actually, if we filter out `rombonganId !== null` in `filteredData`, we don't show them in the normal table.
content = content.replace(
  'const totalLunas = filteredByScope',
  `const filteredRombongan = allRombongan.filter(r => {
    const matchesScope = filterScope === "AKTIF"
      ? activeDufah && r.dufahTujuanId === activeDufah.id
      : filterScope === "GLOBAL"
        ? true
        : r.dufahTujuanId?.toString() === filterScope;
    const matchesSearch = r.nama.toLowerCase().includes(search.toLowerCase());
    return matchesScope && matchesSearch;
  });

  const totalLunas = filteredByScope`
);

content = content.replace(
  't.noKwitansi.toLowerCase().includes(search.toLowerCase())',
  `t.noKwitansi.toLowerCase().includes(search.toLowerCase())
  ).filter(t => !t.rombonganId); // Hide rombongan children from main table`
);

// Add Import button in header
content = content.replace(
  '<h1 className="text-3xl font-extrabold text-gold-500">Meja Keuangan</h1>',
  `<div className="flex items-center gap-4">
              <h1 className="text-3xl font-extrabold text-gold-500">Meja Keuangan</h1>
              {((session?.user as any)?.permissions?.includes("verify_pendaftaran") || (session?.user as any)?.permissions?.includes("all_access")) && (
                <button
                  onClick={() => setIsRombonganModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Import Rombongan
                </button>
              )}
            </div>`
);

// Add Rombongan Table before normal table
content = content.replace(
  '{/* Data Table */}',
  `{/* Rombongan Table */}
        {filteredRombongan.length > 0 && (
          <div className="bg-dark-800 border border-emerald-500/20 rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-emerald-400">Pendaftaran Rombongan / Batch</h3>
                <p className="text-xs text-gray-400">Pendaftaran institusi/rombongan (banyak santri sekaligus)</p>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                {filteredRombongan.length} Rombongan
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-dark-900 border-b border-emerald-500/10">
                  <tr>
                    <th className="px-4 py-4 text-center w-12">No</th>
                    <th className="px-4 py-4">Tgl Mendaftar</th>
                    <th className="px-4 py-4">Nama Rombongan</th>
                    <th className="px-4 py-4 text-center">Jumlah Santri</th>
                    <th className="px-4 py-4 text-right">Total Tagihan (Rp)</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-4 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRombongan.map((r, index) => (
                    <tr key={r.id} className="border-b border-gray-800 hover:bg-dark-900/50 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="px-4 py-4 text-xs font-mono text-gray-400">{new Date(r.createdAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                      <td className="px-4 py-4 font-bold text-white">
                        {r.nama}
                        {r.isMouSigned && <span className="ml-2 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">MoU (Diskon 10%)</span>}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-gold-400">{r.transaksi?.length || 0} Orang</td>
                      <td className="px-4 py-4 text-right font-mono text-sm">
                        {new Intl.NumberFormat('id-ID').format(r.totalTagihan)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {r.statusPembayaran === "PAID" ? (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs font-bold border border-green-500/30">LUNAS</span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-bold border border-red-500/30">PENDING</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {r.statusPembayaran === "PENDING" && (
                          <div className="flex gap-2 justify-center">
                            {((session?.user as any)?.permissions?.includes("verify_pendaftaran") || (session?.user as any)?.permissions?.includes("all_access")) && (
                              <button
                                onClick={() => prosesVerifikasiRombongan(r.id)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                              >
                                ✓ Acc
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data Table */}`
);

// Add Modal at the end of the return statement
content = content.replace(
  '      </div>\n    </Protect>',
  `      </div>

        {/* Modal Rombongan */}
        {isRombonganModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-900 border border-gold-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-dark-800">
                <h3 className="text-xl font-bold text-gold-500">Import Pendaftaran Rombongan</h3>
                <button onClick={() => setIsRombonganModalOpen(false)} className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Rombongan / Instansi</label>
                  <input
                    type="text"
                    value={namaRombongan}
                    onChange={(e) => setNamaRombongan(e.target.value)}
                    placeholder="Contoh: SMAS Al Izzah Kota Batu"
                    className="w-full bg-dark-800 text-white border border-gray-700 px-4 py-3 rounded-xl focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Program (Untuk seluruh santri)</label>
                  <select
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                    className="w-full bg-dark-800 text-white border border-gray-700 px-4 py-3 rounded-xl focus:outline-none focus:border-gold-500"
                  >
                    <option value="">-- Pilih Program --</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.nama} (Rp {new Intl.NumberFormat('id-ID').format(p.harga)})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 bg-dark-800 p-4 rounded-xl border border-gray-700">
                  <input
                    type="checkbox"
                    id="mou"
                    checked={isMouSigned}
                    onChange={(e) => setIsMouSigned(e.target.checked)}
                    className="w-5 h-5 accent-gold-500"
                  />
                  <div>
                    <label htmlFor="mou" className="text-sm font-bold text-white cursor-pointer select-none">Sudah Tanda Tangan MoU</label>
                    <p className="text-xs text-gray-400">Jika dicentang, akan memotong tagihan sebesar 10% untuk setiap anak.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">File Data Excel (.xlsx)</label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                  />
                  {parsedRombonganData.length > 0 && (
                    <p className="mt-2 text-xs text-green-400">✓ Berhasil membaca {parsedRombonganData.length} baris data santri.</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 italic">Kolom yang wajib ada di Excel: Nama. Kolom lainnya: Gender, TempatLahir, TanggalLahir, NamaOrtu, NoWaOrtu, Provinsi, Kabupaten, Kecamatan, Desa, DetailAlamat.</p>
                </div>
              </div>
              <div className="p-6 border-t border-gray-800 bg-dark-800 flex justify-end gap-4">
                <button
                  onClick={() => setIsRombonganModalOpen(false)}
                  className="px-6 py-2 rounded-xl text-gray-400 hover:text-white font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={submitRombongan}
                  disabled={loading || !namaRombongan || !selectedProgramId || parsedRombonganData.length === 0}
                  className="bg-gold-500 hover:bg-gold-400 text-black px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Menyimpan..." : "Simpan & Import"}
                </button>
              </div>
            </div>
          </div>
        )}

    </Protect>`
);

fs.writeFileSync('app/admin/pendaftaran/page.tsx', content);
console.log("Frontend updated");
