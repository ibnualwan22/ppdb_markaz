"use client";

import { useState, useEffect } from "react";

export default function ManajemenDufahPage() {
  const [dataDufah, setDataDufah] = useState<any[]>([]);
  const [nama, setNama] = useState("");
  const [tanggalBuka, setTanggalBuka] = useState("");
  const [tanggalTutup, setTanggalTutup] = useState("");

  const muatData = () => {
    fetch("/api/dufah")
      .then((res) => res.json())
      .then((data) => setDataDufah(data));
  };

  useEffect(() => {
    muatData();
  }, []);

  const tambahDufah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama) return alert("Nama Duf'ah wajib diisi!");

    await fetch("/api/dufah", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, tanggalBuka, tanggalTutup }),
    });
    
    setNama("");
    setTanggalBuka("");
    setTanggalTutup("");
    muatData();
  };

  const jadikanAktif = async (id: number, namaDufah: string) => {
    if (!confirm(`Yakin ingin mengaktifkan ${namaDufah}? (Duf'ah lain akan dinonaktifkan)`)) return;

    const res = await fetch(`/api/dufah/${id}/active`, { method: "PATCH" });
    const data = await res.json();
    
    if (res.ok) {
      alert(data.message);
      muatData();
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b border-gray-300 pb-4">Manajemen Periode (Duf'ah)</h1>

      {/* FORM TAMBAH DUF'AH */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 text-green-700">Buat Duf'ah Baru</h2>
        <form onSubmit={tambahDufah} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-700">Nama Duf'ah</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Cth: Duf'ah 88"
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-700">Waktu Buka Pendaftaran</label>
            <input
              type="datetime-local"
              value={tanggalBuka}
              onChange={(e) => setTanggalBuka(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-700">Waktu Tutup Pendaftaran</label>
            <input
              type="datetime-local"
              value={tanggalTutup}
              onChange={(e) => setTanggalTutup(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            />
          </div>

          <button type="submit" className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 font-bold shadow-sm h-[50px]">
            Simpan Duf'ah
          </button>
        </form>
      </div>

      {/* TABEL DUF'AH */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-300 text-gray-800">
            <tr>
              <th className="p-4">Nama Periode</th>
              <th className="p-4">Jadwal Link Santri Lama</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {dataDufah.map((dufah) => (
              <tr key={dufah.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-bold text-lg">{dufah.nama}</td>
                <td className="p-4 text-sm">
                  {dufah.tanggalBuka ? new Date(dufah.tanggalBuka).toLocaleString('id-ID') : '-'} <br/> 
                  <span className="text-gray-500">s/d</span> <br/> 
                  {dufah.tanggalTutup ? new Date(dufah.tanggalTutup).toLocaleString('id-ID') : '-'}
                </td>
                <td className="p-4">
                  {dufah.isActive ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 rounded-full font-bold text-sm shadow-sm">
                      Aktif Saat Ini
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-full font-semibold text-sm">
                      Non-Aktif
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {!dufah.isActive && (
                    <button 
                      onClick={() => jadikanAktif(dufah.id, dufah.nama)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold shadow-sm text-sm"
                    >
                      Set Aktif
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}