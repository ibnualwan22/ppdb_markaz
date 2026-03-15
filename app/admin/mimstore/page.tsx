"use client";

import { useState, useEffect, useRef } from "react";
import { usePusher } from "../../providers/PusherProvider";
import { swalNotif, swalError } from "../../lib/swal";

// SVG Icon Components
const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function MimStorePage() {
  const [data, setData] = useState<any[]>([]);
  const [dufahNama, setDufahNama] = useState("");
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  // STATE NOTIFIKASI & REAL-TIME
  const [notif, setNotif] = useState({ show: false, pesan: "", namaTarget: "" });
  const pusher = usePusher();

  const putarSuara = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
      audio.play().catch(() => console.log("Browser memblokir autoplay suara"));
    } catch (e) { }
  };

  const tampilkanNotif = (pesan: string, namaTarget?: string) => {
    putarSuara();
    setNotif({ show: true, pesan, namaTarget: namaTarget || "" });
    setTimeout(() => setNotif({ show: false, pesan: "", namaTarget: "" }), 5000);
  };

  const muatData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/mimstore");
      if (res.ok) {
        const result = await res.json();
        setDufahNama(result.dufahNama);
        setData(result.data);
      }
    } catch (error) {
      console.error("Gagal memuat data Mims Store", error);
    }
    if (!isBackground) setLoading(false);
  };

  useEffect(() => {
    muatData();
  }, []);

  // Pusher listeners
  useEffect(() => {
    if (!pusher) return;

    const onDataUpdate = (payload: any) => {
      // Refresh if it's general or specifically for mimstore
      if (!payload.tag || payload.tag === "mimstore" || payload.tag === "id-card") {
        muatData(true);
      }
    };

    const onIdCardNotif = (payload: any) => {
      tampilkanNotif(payload.message, payload.data?.nama);
    };

    const channel = pusher.subscribe("ppdb-channel");
    channel.bind("data:update", onDataUpdate);
    channel.bind("notif:idcard", onIdCardNotif);

    return () => {
      channel.unbind("data:update", onDataUpdate);
      channel.unbind("notif:idcard", onIdCardNotif);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher]);

  const handleUpdate = async (id: string, field: string, value: any) => {
    // Optimistic update locally
    setData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );

    try {
      const res = await fetch("/api/mimstore", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, field, value }),
      });

      if (res.ok) {
        swalNotif("Tersimpan", "success");
      } else {
        swalError("Gagal menyimpan data");
        muatData(true); // Revert back if fail
      }
    } catch (error) {
      swalError("Terjadi kesalahan jaringan");
      muatData(true);
    }
  };

  const dataDitampilkan = data.filter(item =>
    item.santri.nama.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen relative overflow-hidden">
      
      {/* POP-UP NOTIFIKASI */}
      <div className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-out ${notif.show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}>
        <div className="bg-dark-800 border-l-4 border-gold-500 shadow-2xl rounded-xl p-4 flex items-center gap-3 min-w-[300px] border-y border-r border-gold-500/20">
          <div className="bg-dark-900 border border-gold-500/30 p-2 rounded-full animate-bounce text-gold-500"><IconBell /></div>
          <div>
            <h4 className="font-bold text-gold-400 text-sm">Informasi Baru</h4>
            <p className="text-gray-300 text-xs font-medium">{notif.pesan}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 border-b border-gold-500/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gold-500">Mims Store</h1>
          <p className="text-gray-400 mt-1 font-medium">Pembagian Atribut untuk Santri Baru ({dufahNama}).</p>
        </div>
      </div>

      <div className="bg-dark-800 p-6 rounded-2xl shadow-sm border border-gold-500/20 mb-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 w-full md:w-1/2">
          <label className="block text-sm font-bold text-gray-300 mb-2">Cari Nama Santri</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><IconSearch /></span>
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ketik nama santri..." className="w-full pl-10 p-3 border border-dark-900 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/50 bg-dark-900 text-gray-200 placeholder:text-gray-600 shadow-inner" />
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-2xl shadow-sm border border-gold-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-dark-900 border-b border-gold-500/20">
              <tr>
                <th className="p-4 text-gold-600 font-bold text-center w-24">No. ID Card</th>
                <th className="p-4 text-gold-600 font-bold min-w-[200px]">Nama Lengkap & Lokasi</th>
                <th className="p-4 text-gold-600 font-bold text-center">Dresscode</th>
                <th className="p-4 text-gold-600 font-bold text-center">Tote Bag</th>
                <th className="p-4 text-gold-600 font-bold text-center">Pin / Dabus</th>
                <th className="p-4 text-gold-600 font-bold text-center">Songkok / Khimar</th>
                <th className="p-4 text-gold-600 font-bold text-center">Malzamah</th>
                <th className="p-4 text-gold-600 font-bold text-center">Ta'birot</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-500 font-medium">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : dataDitampilkan.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-gray-500 italic font-medium">Data santri tidak ditemukan.</td></tr>
              ) : (
                dataDitampilkan.map((item) => (
                  <tr key={item.id} className="border-b border-gold-500/5 hover:bg-dark-900/50 transition">
                    <td className="p-4 text-center">
                      <span className="bg-dark-900 text-gray-300 border border-gray-700 font-black text-sm px-2.5 py-1 rounded-lg">
                        {item.nomorIdCard || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-200 text-base">{item.santri.nama}</p>
                      {item.lemari ? (
                        <p className="text-xs text-gray-500 mt-1 uppercase font-medium">
                          {item.lemari.kamar.sakan.nama} • {item.lemari.kamar.nama} • lkr {item.lemari.nomor}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500 mt-1 italic">Belum dapat lemari</p>
                      )}
                    </td>

                    {/* Dresscode */}
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <label className="flex items-center cursor-pointer gap-2">
                          <input type="checkbox" className="w-5 h-5 accent-gold-500 cursor-pointer"
                            checked={item.isDresscodeTaken}
                            onChange={(e) => handleUpdate(item.id, 'isDresscodeTaken', e.target.checked)}
                          />
                        </label>
                        <input type="text" placeholder="Ukuran" className="w-16 p-1 text-xs text-center border border-dark-900 rounded bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500"
                          defaultValue={item.ukuranDresscode || ""}
                          onBlur={(e) => {
                            if (e.target.value !== item.ukuranDresscode) {
                              handleUpdate(item.id, 'ukuranDresscode', e.target.value);
                            }
                          }}
                        />
                      </div>
                    </td>

                    {/* Tote Bag */}
                    <td className="p-4 text-center">
                      <input type="checkbox" className="w-5 h-5 accent-gold-500 cursor-pointer"
                        checked={item.isToteBagTaken}
                        onChange={(e) => handleUpdate(item.id, 'isToteBagTaken', e.target.checked)}
                      />
                    </td>

                    {/* Pin / Dabus */}
                    <td className="p-4 text-center">
                      <input type="checkbox" className="w-5 h-5 accent-gold-500 cursor-pointer"
                        checked={item.isPinTaken}
                        onChange={(e) => handleUpdate(item.id, 'isPinTaken', e.target.checked)}
                      />
                    </td>

                    {/* Songkok / Khimar */}
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2 text-xs text-gray-400 font-medium">
                        <span>{item.santri.gender === 'BANIN' ? 'Songkok' : 'Khimar'}</span>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-5 h-5 accent-gold-500 cursor-pointer"
                            checked={item.isSongkokKhimarTaken}
                            onChange={(e) => handleUpdate(item.id, 'isSongkokKhimarTaken', e.target.checked)}
                          />
                          {item.santri.gender === 'BANIN' && (
                            <input type="text" placeholder="Ukuran" className="w-16 p-1 text-xs text-center border border-dark-900 rounded bg-dark-900 text-gray-200 outline-none focus:ring-1 focus:ring-gold-500"
                              defaultValue={item.ukuranSongkok || ""}
                              onBlur={(e) => {
                                if (e.target.value !== item.ukuranSongkok) {
                                  handleUpdate(item.id, 'ukuranSongkok', e.target.value);
                                }
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Malzamah */}
                    <td className="p-4 text-center">
                      <input type="checkbox" className="w-5 h-5 accent-gold-500 cursor-pointer"
                        checked={item.isMalzamahTaken}
                        onChange={(e) => handleUpdate(item.id, 'isMalzamahTaken', e.target.checked)}
                      />
                    </td>

                    {/* Ta'birot */}
                    <td className="p-4 text-center">
                      <input type="checkbox" className="w-5 h-5 accent-gold-500 cursor-pointer"
                        checked={item.isTabirotTaken}
                        onChange={(e) => handleUpdate(item.id, 'isTabirotTaken', e.target.checked)}
                      />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
