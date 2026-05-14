"use client";

import React, { useEffect, useState, useMemo } from "react";

interface Agenda {
  id: string;
  judul: string;
  deskripsi: string;
  waktuMulai: string;
  waktuSelesai: string;
  isBerulang: boolean;
  tipePerulangan: string;
}

// Nama hari dan bulan dalam Bahasa Indonesia
const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Ahd"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function AgendaRutinan() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAgendas, setSelectedAgendas] = useState<Agenda[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();

  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const response = await fetch("https://siakad.markazarabiyah.site/api/public/agenda");
        const json = await response.json();
        if (json.success) {
          setAgendas(json.data);
        } else {
          setError("Gagal memuat data agenda.");
        }
      } catch {
        setError("Terjadi kesalahan saat memuat agenda.");
      } finally {
        setLoading(false);
      }
    };
    fetchAgenda();
  }, []);

  // Proyeksikan agenda rutin ke bulan yang sedang dilihat
  const projectedEvents = useMemo(() => {
    const map: Record<number, Agenda[]> = {};

    agendas.forEach((agenda) => {
      const mulai = new Date(agenda.waktuMulai);
      const selesai = new Date(agenda.waktuSelesai);

      if (agenda.isBerulang) {
        // Untuk agenda berulang, proyeksikan ke bulan saat ini
        if (agenda.tipePerulangan === "BULANAN") {
          // Ambil hari dari tanggal aslinya, tampilkan di bulan ini
          const dayOfMonth = mulai.getDate();
          const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
          const projectedDay = Math.min(dayOfMonth, maxDay);
          if (!map[projectedDay]) map[projectedDay] = [];
          map[projectedDay].push(agenda);

          // Jika selesai di tanggal berbeda, tandai juga
          const endDay = selesai.getDate();
          if (endDay !== dayOfMonth) {
            const projectedEndDay = Math.min(endDay, maxDay);
            if (!map[projectedEndDay]) map[projectedEndDay] = [];
            // Hindari duplikat
            if (!map[projectedEndDay].find(a => a.id === agenda.id)) {
              map[projectedEndDay].push(agenda);
            }
          }
        } else if (agenda.tipePerulangan === "MINGGUAN") {
          // Untuk mingguan, tampilkan di setiap hari yang sama di bulan ini
          const dayOfWeek = mulai.getDay(); // 0=Minggu, 1=Senin, dst.
          const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
          for (let d = 1; d <= maxDay; d++) {
            const dt = new Date(currentYear, currentMonth, d);
            if (dt.getDay() === dayOfWeek) {
              if (!map[d]) map[d] = [];
              map[d].push(agenda);
            }
          }
        } else if (agenda.tipePerulangan === "HARIAN") {
          // Untuk harian, tampilkan di setiap hari
          const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
          for (let d = 1; d <= maxDay; d++) {
            if (!map[d]) map[d] = [];
            map[d].push(agenda);
          }
        }
      } else {
        // Agenda non-berulang: hanya tampilkan jika jatuh di bulan/tahun ini
        if (mulai.getMonth() === currentMonth && mulai.getFullYear() === currentYear) {
          const day = mulai.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(agenda);
        }
        // Cek range jika selesai di tanggal berbeda
        if (selesai.getTime() !== mulai.getTime()) {
          const endInThisMonth = selesai.getMonth() === currentMonth && selesai.getFullYear() === currentYear;
          if (endInThisMonth) {
            const endDay = selesai.getDate();
            const startDay = (mulai.getMonth() === currentMonth && mulai.getFullYear() === currentYear) ? mulai.getDate() : 1;
            for (let d = startDay + 1; d <= endDay; d++) {
              if (!map[d]) map[d] = [];
              if (!map[d].find(a => a.id === agenda.id)) {
                map[d].push(agenda);
              }
            }
          }
        }
      }
    });

    return map;
  }, [agendas, currentMonth, currentYear]);

  // Hitung grid kalender
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    // getDay(): 0=Minggu. Kita ingin Senin=0, jadi adjust
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6; // Minggu jadi 6

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const cells: { day: number; isCurrentMonth: boolean }[] = [];

    // Hari dari bulan sebelumnya
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }

    // Hari bulan ini
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, isCurrentMonth: true });
    }

    // Isi sisa baris terakhir dengan hari bulan depan
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, isCurrentMonth: false });
      }
    }

    return cells;
  }, [currentMonth, currentYear]);

  const navigateMonth = (offset: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + offset, 1));
    setSelectedDay(null);
    setSelectedAgendas([]);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
    setSelectedAgendas([]);
  };

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    const events = projectedEvents[day] || [];
    if (events.length > 0) {
      setSelectedDay(day);
      setSelectedAgendas(events);
    } else {
      setSelectedDay(day);
      setSelectedAgendas([]);
    }
  };

  const formatWaktu = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB";
    } catch {
      return dateString;
    }
  };

  const getBadgeLabel = (tipe: string) => {
    switch (tipe) {
      case 'HARIAN': return 'Harian';
      case 'MINGGUAN': return 'Mingguan';
      case 'BULANAN': return 'Bulanan';
      default: return tipe;
    }
  };

  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  // Warna untuk event (cycle)
  const EVENT_HEX = ['#10b981','#3b82f6','#f59e0b','#a855f7','#f43f5e'];
  const EVENT_HEX_TEXT = ['#34d399','#60a5fa','#fbbf24','#c084fc','#fb7185'];

  // Daftar unik agenda bulan ini untuk legenda mobile
  const monthAgendaList = useMemo(() => {
    const seen = new Set<string>();
    const list: { agenda: Agenda; color: string; textColor: string; days: number[] }[] = [];
    const sortedDays = Object.keys(projectedEvents).map(Number).sort((a,b) => a - b);
    sortedDays.forEach(day => {
      projectedEvents[day].forEach((ag) => {
        if (!seen.has(ag.id)) {
          seen.add(ag.id);
          const ci = list.length % EVENT_HEX.length;
          list.push({ agenda: ag, color: EVENT_HEX[ci], textColor: EVENT_HEX_TEXT[ci], days: [day] });
        } else {
          const item = list.find(l => l.agenda.id === ag.id);
          if (item && !item.days.includes(day)) item.days.push(day);
        }
      });
    });
    return list;
  }, [projectedEvents]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="h-7 bg-dark-800 rounded w-32 animate-pulse" />
          <div className="h-8 bg-dark-800 rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`h-${i}`} className="h-8 bg-dark-800/50 rounded animate-pulse" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={`d-${i}`} className="h-16 bg-dark-800/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h2 className="text-lg font-bold text-gold-500 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Kalender Kegiatan
        </h2>
        <div className="bg-red-500/10 text-red-400 p-6 rounded-xl border border-red-500/20 text-center">
          <p className="font-semibold">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Kalender */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-white">
          {BULAN[currentMonth]} <span className="text-gold-500">{currentYear}</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-bold text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 rounded-lg transition-colors"
          >
            Hari Ini
          </button>
          <button
            onClick={() => navigateMonth(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white border border-dark-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white border border-dark-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Header Hari */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {HARI.map((h, i) => (
          <div
            key={h}
            className={`text-center text-xs font-bold uppercase tracking-wider py-2 rounded-lg ${
              i === 4 ? "text-emerald-500" : i >= 5 ? "text-red-400/70" : "text-gray-500"
            }`}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Grid Tanggal */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => {
          const events = cell.isCurrentMonth ? (projectedEvents[cell.day] || []) : [];
          const hasEvents = events.length > 0;
          const isTodayCell = cell.isCurrentMonth && isToday(cell.day);
          const isSelected = cell.isCurrentMonth && selectedDay === cell.day;

          // Cek apakah hari Jumat (index 4 di grid, tapi kita perlu cek actual date)
          const actualDate = cell.isCurrentMonth ? new Date(currentYear, currentMonth, cell.day) : null;
          const isFriday = actualDate?.getDay() === 5;
          const isWeekend = actualDate ? (actualDate.getDay() === 6 || actualDate.getDay() === 0) : false;

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(cell.day, cell.isCurrentMonth)}
              className={`
                relative min-h-[60px] md:min-h-[72px] p-1.5 rounded-lg border transition-all text-left flex flex-col
                ${!cell.isCurrentMonth
                  ? "text-gray-700 border-transparent cursor-default"
                  : isSelected
                    ? "border-gold-500/50 bg-gold-500/10 shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                    : isTodayCell
                      ? "border-gold-500/30 bg-dark-800"
                      : hasEvents
                        ? "border-dark-700 bg-dark-900 hover:border-gold-500/30 hover:bg-dark-800 cursor-pointer"
                        : "border-transparent bg-dark-900/50 hover:bg-dark-800/50"
                }
              `}
            >
              <span className={`
                text-sm font-bold leading-none
                ${!cell.isCurrentMonth ? "text-gray-700" :
                  isTodayCell ? "text-dark-900 bg-gold-500 w-6 h-6 rounded-full flex items-center justify-center text-xs" :
                  isFriday ? "text-emerald-500" :
                  isWeekend ? "text-red-400/70" :
                  "text-gray-300"
                }
              `}>
                {cell.day}
              </span>

              {/* Event indicators — dots on mobile, labels on desktop */}
              {hasEvents && cell.isCurrentMonth && (
                <>
                  {/* Mobile: colored dots */}
                  <div className="mt-auto flex gap-0.5 md:hidden flex-wrap">
                    {events.slice(0, 3).map((ev, ei) => (
                      <span key={ev.id + ei} className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: EVENT_HEX[ei % EVENT_HEX.length] }} />
                    ))}
                    {events.length > 3 && <span className="text-[8px] text-gray-500 font-bold">+{events.length - 3}</span>}
                  </div>
                  {/* Desktop: text labels */}
                  <div className="mt-auto space-y-0.5 overflow-hidden hidden md:block">
                    {events.slice(0, 2).map((ev, ei) => (
                      <div key={ev.id + ei} className="text-[10px] font-bold leading-tight truncate rounded px-1 py-0.5" style={{ backgroundColor: `color-mix(in srgb, ${EVENT_HEX[ei % EVENT_HEX.length]} 15%, transparent)`, color: EVENT_HEX_TEXT[ei % EVENT_HEX_TEXT.length] }}>
                        {ev.judul}
                      </div>
                    ))}
                    {events.length > 2 && <div className="text-[9px] text-gray-500 font-bold px-1">+{events.length - 2} lagi</div>}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail Agenda yang Dipilih */}
      {selectedDay !== null && (
        <div className="mt-4 bg-dark-900 border border-dark-800 rounded-xl p-5 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-white">
              {selectedDay} {BULAN[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={() => { setSelectedDay(null); setSelectedAgendas([]); }}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {selectedAgendas.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Tidak ada agenda di tanggal ini.</p>
          ) : (
            <div className="space-y-3">
              {selectedAgendas.map((agenda, i) => (
                <div
                  key={agenda.id}
                  className="bg-dark-950 border border-dark-800 rounded-lg p-4 hover:border-dark-700 transition-colors"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : i === 2 ? '#f59e0b' : '#a855f7'
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-bold text-white text-sm">{agenda.judul}</h4>
                    {agenda.isBerulang && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20 shrink-0 uppercase tracking-wider">
                        {getBadgeLabel(agenda.tipePerulangan)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{agenda.deskripsi}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>{formatWaktu(agenda.waktuMulai)}</span>
                    </div>
                    <span className="text-gray-700">—</span>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>{formatWaktu(agenda.waktuSelesai)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daftar Agenda Bulan Ini — selalu tampil di mobile, tersembunyi di desktop */}
      {monthAgendaList.length > 0 && (
        <div className="mt-4 md:mt-5">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Agenda {BULAN[currentMonth]}</h3>
          <div className="space-y-2">
            {monthAgendaList.map((item) => (
              <div key={item.agenda.id} className="flex items-start gap-3 bg-dark-900 border border-dark-800 rounded-lg p-3 hover:border-dark-700 transition-colors" style={{ borderLeftWidth: '3px', borderLeftColor: item.color }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-white text-sm truncate">{item.agenda.judul}</h4>
                    {item.agenda.isBerulang && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20 shrink-0 uppercase">{getBadgeLabel(item.agenda.tipePerulangan)}</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">Tgl: {item.days.join(', ')} &bull; {formatWaktu(item.agenda.waktuMulai)} - {formatWaktu(item.agenda.waktuSelesai)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
