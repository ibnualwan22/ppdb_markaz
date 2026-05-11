"use client";

import { useEffect, useState } from "react";

export default function DigitalCardPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  if (!id) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const imageUrl = `/api/digital-card/${id}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Kartu_Digital_${id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mendownload gambar", error);
      alert("Gagal mendownload gambar. Silakan coba tahan gambar (long press) dan pilih 'Save Image'.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gold-500 mb-2">Kartu Santri Digital</h1>
          <p className="text-gray-400 text-sm">Simpan kartu ini sebagai bukti pengambilan barang di Mims Store.</p>
        </div>

        <div className="relative w-full aspect-[8/5] max-w-[800px] rounded-xl overflow-hidden shadow-2xl shadow-gold-500/20 border border-gold-500/30">
          <img 
            src={imageUrl} 
            alt="Kartu Digital" 
            className="w-full h-full object-contain bg-dark-900"
          />
        </div>

        <button 
          onClick={handleDownload}
          className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download Kartu
        </button>
      </div>
    </div>
  );
}
