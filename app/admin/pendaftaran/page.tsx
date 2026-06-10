"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Protect } from "@/components/Protect";
import { swalSuccess, swalError } from "@/app/lib/swal";
import { usePusher } from "@/app/providers/PusherProvider";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { generateRegistrationPdf, generateRombonganInvoicePdf } from "@/app/lib/generateRegistrationPdf";
import Swal from 'sweetalert2';

const COLORS = ['#22c55e', '#ef4444']; // Green for PAID, Red for PENDING

export default function MejaKeuanganPage() {
  const { data: session } = useSession();
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [allDufah, setAllDufah] = useState<any[]>([]);
  const [allRombongan, setAllRombongan] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  // Rombongan Upload Modal State
  const [isRombonganModalOpen, setIsRombonganModalOpen] = useState(false);
  const [rombonganFile, setRombonganFile] = useState<File | null>(null);
  const [namaRombongan, setNamaRombongan] = useState("");
  const [isMouSigned, setIsMouSigned] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [parsedRombonganData, setParsedRombonganData] = useState<any[]>([]);
  const [daftarUlang, setDaftarUlang] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState("AKTIF"); // "AKTIF" atau "GLOBAL"
  const [filterLunas, setFilterLunas] = useState("ALL"); // "ALL", "LUNAS", "BELUM"
  const [filterKategori, setFilterKategori] = useState("ALL"); // "ALL", "BARU", "LAMA"
  const [filterProgram, setFilterProgram] = useState("REGULER"); // "ALL", "REGULER", "TUROTS"

  const pusher = usePusher();

  const muatData = async () => {
    try {
      const res = await fetch("/api/pendaftaran");
      if (res.ok) {
        const data = await res.json();
        setTransaksi(data.transaksi || []);
        setAllDufah(data.allDufah || []);
        setDaftarUlang(data.daftarUlang || []);
        setAllRombongan(data.allRombongan || []);
        setPrograms(data.programs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  useEffect(() => {
    if (!pusher) return;
    const channel = pusher.subscribe("ppdb-channel");
    const onUpdate = () => muatData();
    channel.bind("data:update", onUpdate);

    return () => {
      channel.unbind("data:update", onUpdate);
      pusher.unsubscribe("ppdb-channel");
    };
  }, [pusher]);

  const prosesVerifikasi = async (id: string, isKSU: boolean = false) => {
    if (!confirm(`Yakin ingin memverifikasi transaksi ini${isKSU ? ' sebagai KSU GRATIS' : ''}?`)) return;

    setLoading(true);
    try {
      const adminId = (session?.user as any)?.id;
      const res = await fetch(`/api/pendaftaran/${id}/verifikasi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, isKSU })
      });

      const data = await res.json();
      if (res.ok) {
        swalSuccess("Berhasil", "Verifikasi lunas berhasil. Santri masuk antrean asrama.");
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

  const prosesVerifikasiDaftarUlang = async (id: string) => {
    if (!confirm("Yakin ingin memverifikasi pelunasan daftar ulang santri lama ini?")) return;
    setLoading(true);
    try {
      const adminId = (session?.user as any)?.id;
      const res = await fetch(`/api/daftar-ulang/${id}/verifikasi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId })
      });
      const data = await res.json();
      if (res.ok) {
        swalSuccess("Berhasil", "Daftar ulang berhasil diverifikasi lunas.");
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

  const hapusTransaksi = async (id: string, namaSantri: string) => {
    const isSuperAdmin = (session?.user as any)?.permissions?.includes("all_access");
    if (!isSuperAdmin) {
      return swalError("Gagal", "Hanya Super Admin yang dapat menghapus data pendaftaran.");
    }

    const { value: confirmName } = await Swal.fire({
      title: 'Hapus Data Pendaftaran?',
      html: `Data pendaftaran <b>${namaSantri}</b> akan dihapus secara permanen dari sistem.<br><br>Ketik nama santri <b>${namaSantri}</b> untuk melanjutkan:`,
      input: 'text',
      inputPlaceholder: namaSantri,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      inputValidator: (value: string) => {
        if (value !== namaSantri) {
          return 'Nama yang diketik tidak cocok!';
        }
      }
    });

    if (confirmName === namaSantri) {
      setLoading(true);
      try {
        const res = await fetch(`/api/pendaftaran/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok) {
          swalSuccess("Berhasil", "Data pendaftaran berhasil dihapus.");
          muatData();
        } else {
          swalError("Gagal", data.error || "Gagal menghapus data");
        }
      } catch (e) {
        swalError("Error", "Terjadi kesalahan server");
      } finally {
        setLoading(false);
      }
    }
  };

  const prosesVerifikasiRombongan = async (id: string) => {
    if (!confirm("Yakin ingin memverifikasi pelunasan seluruh rombongan ini?")) return;
    setLoading(true);
    try {
      const adminId = (session?.user as any)?.id;
      const res = await fetch(`/api/admin/keuangan/rombongan/${id}/verifikasi`, {
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

  const hapusRombongan = async (id: string, namaRombongan: string) => {
    const isSuperAdmin = (session?.user as any)?.permissions?.includes("all_access");
    if (!isSuperAdmin) {
      return swalError("Gagal", "Hanya Super Admin yang dapat menghapus data rombongan.");
    }

    if (!confirm(`Yakin ingin menghapus seluruh data pendaftaran rombongan ${namaRombongan}? Ini akan menghapus transaksi dan santri di dalamnya jika belum di-acc.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/keuangan/rombongan/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        swalSuccess("Berhasil", "Data rombongan berhasil dihapus.");
        muatData();
      } else {
        swalError("Gagal", data.error || "Gagal menghapus data rombongan");
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
      const toTitleCase = (str: string) => {
        if (!str) return "";
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      };

      const formatWa = (wa: string | number) => {
        if (!wa) return "";
        let f = wa.toString().replace(/\D/g, "");
        if (f.startsWith("0")) f = "62" + f.substring(1);
        return f;
      };

      const parseTanggalLahir = (val: any) => {
        if (!val) return null;

        if (typeof val === 'number' || (!isNaN(Number(val)) && Number(val) > 20000)) {
          const date = new Date(Math.round((Number(val) - 25569) * 86400 * 1000));
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }

        const s = val.toString().trim();
        const parts = s.split(/[\/\-]/);
        if (parts.length === 3) {
          const dd = parts[0].padStart(2, '0');
          const mm = parts[1].padStart(2, '0');
          let yyyy = parts[2];
          if (yyyy.length === 2) yyyy = "20" + yyyy;
          return `${yyyy}-${mm}-${dd}`;
        }
        return s;
      };

      const santris = parsedRombonganData.map((row: any) => ({
        nis: row.NIS || row.nis || "",
        nama: toTitleCase(row.Nama || row.nama || ""),
        gender: row.Gender || row.gender || "BANIN",
        tempatLahir: toTitleCase(row.TempatLahir || row.tempatLahir || ""),
        tanggalLahir: parseTanggalLahir(row.TanggalLahir || row.tanggalLahir),
        namaOrtu: toTitleCase(row.NamaOrtu || row.namaOrtu || ""),
        noWaOrtu: formatWa(row.NoWaOrtu || row.noWaOrtu),
        noWaSantri: formatWa(row.NoWaSantri || row.noWaSantri),
        provinsi: toTitleCase(row.Provinsi || row.provinsi || ""),
        kabupaten: toTitleCase(row.Kabupaten || row.kabupaten || ""),
        kecamatan: toTitleCase(row.Kecamatan || row.kecamatan || ""),
        desa: toTitleCase(row.Desa || row.desa || ""),
        detailAlamat: row.DetailAlamat || row.detailAlamat || "",
      })).filter(s => s.nama);

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

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        NIS: "2401001",
        Nama: "Santri Contoh",
        Gender: "BANIN",
        TempatLahir: "Batu",
        TanggalLahir: "20/05/2010",
        NamaOrtu: "Bapak Contoh",
        NoWaOrtu: "081234567890",
        NoWaSantri: "081234567890",
        Provinsi: "Jawa Timur",
        Kabupaten: "Batu",
        Kecamatan: "Batu",
        Desa: "Ngaglik",
        DetailAlamat: "Jl. Contoh No 123"
      }
    ]);
    // Set lebar kolom agar rapi
    ws["!cols"] = [
      { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Santri");
    XLSX.writeFile(wb, "Template_Rombongan_Santri.xlsx");
  };

  const batalkanDaftarUlang = async (id: string) => {
    if (!confirm("Yakin ingin membatalkan pendaftaran ulang santri ini? Data kamar asramanya untuk periode ini akan dilepas.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/daftar-ulang/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        swalSuccess("Berhasil", "Daftar ulang berhasil dibatalkan.");
        muatData();
      } else {
        swalError("Gagal", data.error || "Gagal membatalkan");
      }
    } catch (e) {
      swalError("Error", "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleTagihWa = (noWa: string, nama: string, tagihan: number) => {
    if (!noWa) return swalError("Error", "Nomor WA tidak tersedia");
    const pesan = `Assalamu'alaikum, Bapak/Ibu wali dari santri *${nama}*.\n\nKami dari Admin Markaz Arabiyah menginformasikan bahwa tagihan pendaftaran sebesar *Rp ${new Intl.NumberFormat('id-ID').format(tagihan)}* masih berstatus PENDING. Mohon segera melunasi ke rekening BRI 0555-01-001108-569 agar ananda bisa segera diproses kamar asramanya.\n\nJazakumullah khairan.`;
    window.open(`https://wa.me/${noWa}?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  const activeDufah = allDufah.find(d => d.isActive);
  const now = new Date();
  const targetDufah = allDufah.find(d => d.tanggalBuka && d.tanggalTutup && now >= new Date(d.tanggalBuka) && now <= new Date(d.tanggalTutup));

  const exportToExcel = () => {
    let combinedData: any[] = [];

    // Gunakan filteredByScope agar Rombongan juga ikut ter-export
    const dataToExport = filteredByScope.filter(t =>
      t.santri.nama.toLowerCase().includes(search.toLowerCase()) ||
      t.noKwitansi.toLowerCase().includes(search.toLowerCase())
    );

    // Map data Transaksi Online (Bisa Baru / Lama / Rombongan)
    dataToExport.forEach((t: any) => {
      const isLama = t.noKwitansi?.includes("RENEW-");
      const isRombongan = !!t.rombonganId;

      let kategori = "Baru";
      if (isLama) kategori = "Lama";
      if (isRombongan) kategori = "Rombongan";

      // Filter Kategori (Rombongan kita anggap masuk filter BARU atau ALL)
      if (filterKategori === "BARU" && kategori === "Lama") return;
      if (filterKategori === "LAMA" && kategori !== "Lama") return;

      // Filter Program (Turots/Reguler)
      if (filterProgram !== "ALL" && t.program?.kategoriProgram !== filterProgram) return;

      combinedData.push({
        id: t.id,
        santri: t.santri,
        program: t.program,
        totalTagihan: t.totalTagihan || 0,
        diskon: t.diskon || 0,
        statusPembayaran: t.statusPembayaran,
        noKwitansi: t.noKwitansi || "-",
        kategori: kategori,
        isLunas: t.statusPembayaran === "PAID" || t.statusPembayaran === "KSU_GRATIS"
      });
    });

    // Map data Daftar Ulang (Offline / Belum Lunas via form)
    if (filterKategori === "ALL" || filterKategori === "LAMA") {
      filteredDaftarUlang.forEach((d: any) => {
        combinedData.push({
          id: d.id,
          santri: d.santri,
          program: null,
          totalTagihan: 0,
          diskon: 0,
          statusPembayaran: d.isLunas ? "PAID" : "PENDING",
          noKwitansi: "-",
          kategori: "Lama",
          isLunas: d.isLunas
        });
      });
    }

    // Filter By Lunas
    if (filterLunas === "LUNAS") {
      combinedData = combinedData.filter(x => x.isLunas);
    } else if (filterLunas === "BELUM") {
      combinedData = combinedData.filter(x => !x.isLunas);
    }

    // Hitung Total Uang
    const totalTerkumpul = combinedData
      .filter(x => x.isLunas)
      .reduce((acc, curr) => acc + (curr.totalTagihan || 0), 0);

    // Build Export Array
    const exportArray: any[] = combinedData.map((x, i) => ({
      "No": i + 1,
      "No. Kwitansi": x.noKwitansi || "-",
      "Nama Santri": x.santri?.nama || "-",
      "Gender": x.santri?.gender || "-",
      "Kategori": x.kategori,
      "Program Terpilih": x.program?.nama || "-",
      "Tempat Lahir": x.santri?.tempatLahir || "-",
      "Tanggal Lahir": x.santri?.tanggalLahir ? new Date(x.santri.tanggalLahir).toLocaleDateString('id-ID') : "-",
      "Nama Wali": x.santri?.namaOrtu || "-",
      "No. WA Wali": x.santri?.noWaOrtu || "-",
      "No. WA Santri": x.santri?.noWaSantri || "-",
      "Provinsi": x.santri?.provinsi || "-",
      "Kabupaten": x.santri?.kabupaten || "-",
      "Kecamatan": x.santri?.kecamatan || "-",
      "Desa": x.santri?.desa || "-",
      "Detail Alamat": x.santri?.detailAlamat || "-",
      "Total Tagihan": x.totalTagihan || 0,
      "Diskon": x.diskon || 0,
      "Status": x.isLunas ? "LUNAS" : "BELUM LUNAS"
    }));

    // Tambah Baris Kosong & Total
    exportArray.push({});
    exportArray.push({
      "No": "TOTAL UANG TERKUMPUL (DARI STATUS LUNAS):",
      "No. Kwitansi": totalTerkumpul
    });

    const ws = XLSX.utils.json_to_sheet(exportArray);

    // Mempercantik lebar kolom agar rapi saat dibuka
    const wscols = [
      { wch: 5 },  // No
      { wch: 20 }, // No Kwitansi
      { wch: 30 }, // Nama Santri
      { wch: 10 }, // Gender
      { wch: 15 }, // Kategori
      { wch: 25 }, // Program
      { wch: 15 }, // Tempat Lahir
      { wch: 15 }, // Tgl Lahir
      { wch: 25 }, // Nama Wali
      { wch: 18 }, // WA Wali
      { wch: 18 }, // WA Santri
      { wch: 18 }, // Provinsi
      { wch: 18 }, // Kabupaten
      { wch: 18 }, // Kecamatan
      { wch: 18 }, // Desa
      { wch: 40 }, // Detail Alamat
      { wch: 18 }, // Total Tagihan
      { wch: 12 }, // Diskon
      { wch: 15 }  // Status
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Keuangan");
    XLSX.writeFile(wb, `Data_Keuangan_Santri_${new Date().getTime()}.xlsx`);
  };

  // Filter scope
  const filteredByScope = filterScope === "AKTIF"
    ? transaksi.filter(t => {
      const matchesActive = activeDufah && (t.dufahTujuanId === activeDufah.id || t.noKwitansi.includes(`-${activeDufah.id}-`) || t.noKwitansi.includes(`RENEW-${activeDufah.id}-`));
      const matchesTarget = targetDufah && (t.dufahTujuanId === targetDufah.id || t.noKwitansi.includes(`-${targetDufah.id}-`) || t.noKwitansi.includes(`RENEW-${targetDufah.id}-`));
      return matchesActive || matchesTarget;
    })
    : filterScope === "GLOBAL"
      ? transaksi
      : transaksi.filter(t => {
        const dufahIdStr = filterScope;
        return t.dufahTujuanId?.toString() === dufahIdStr || t.noKwitansi.includes(`-${dufahIdStr}-`) || t.noKwitansi.includes(`RENEW-${dufahIdStr}-`);
      });

  const selectedDufahLabel = filterScope === "AKTIF"
    ? (activeDufah?.nama || targetDufah?.nama || "Duf'ah Aktif")
    : filterScope === "GLOBAL"
      ? "Semua Data (Global)"
      : allDufah.find(d => d.id.toString() === filterScope)?.nama || "Duf'ah";

  const filteredRombongan = allRombongan.filter(r => {
    // 1. Filter Kategori: Rombongan selalu dianggap BARU
    if (filterKategori === "LAMA") return false;

    // 2. Filter Status Lunas
    // Rombongan dianggap lunas jika semua transaksinya PAID
    const isPaid = r.transaksi?.every((t: any) => t.statusPembayaran === "PAID" || t.statusPembayaran === "KSU_GRATIS");
    const matchesLunas = filterLunas === "ALL"
      ? true
      : filterLunas === "LUNAS" ? isPaid : !isPaid;

    const matchesScope = filterScope === "AKTIF"
      ? activeDufah && r.dufahTujuanId === activeDufah.id
      : filterScope === "GLOBAL"
        ? true
        : r.dufahTujuanId?.toString() === filterScope;
    const matchesSearch = r.nama.toLowerCase().includes(search.toLowerCase());

    // Filter Program: Rombongan transaksi harus cocok
    const matchesProgram = filterProgram === "ALL" ? true : r.transaksi?.some((t: any) => t.program?.kategoriProgram === filterProgram);

    return matchesScope && matchesSearch && matchesLunas && matchesProgram;
  });

  const dataForMetrics = filteredByScope.filter(t => {
    const isRombonganMatched = t.rombonganId && allRombongan.find(r => r.id === t.rombonganId)?.nama.toLowerCase().includes(search.toLowerCase());
    const matchesSearch = t.santri.nama.toLowerCase().includes(search.toLowerCase()) || t.noKwitansi.toLowerCase().includes(search.toLowerCase()) || isRombonganMatched;
    
    const isPaid = t.statusPembayaran === "PAID" || t.statusPembayaran === "KSU_GRATIS";
    const matchesLunas = filterLunas === "ALL" ? true : filterLunas === "LUNAS" ? isPaid : !isPaid;

    const isLama = t.noKwitansi?.includes("RENEW-");
    const matchesKategori = filterKategori === "ALL" ? true : filterKategori === "BARU" ? !isLama : isLama;

    // Filter Program (Turots/Reguler)
    const matchesProgram = filterProgram === "ALL" ? true : t.program?.kategoriProgram === filterProgram;

    return matchesSearch && matchesLunas && matchesKategori && matchesProgram;
  });

  const totalLunas = dataForMetrics
    .filter(t => t.statusPembayaran === "PAID")
    .reduce((acc, t) => acc + (t.totalTagihan || 0), 0);

  const totalPending = dataForMetrics
    .filter(t => t.statusPembayaran === "PENDING")
    .reduce((acc, t) => acc + (t.totalTagihan || 0), 0);

  // Statistics Counts
  const countTotalPendaftar = dataForMetrics.length;
  const countSudahBayar = dataForMetrics.filter(t => t.statusPembayaran === "PAID" || t.statusPembayaran === "KSU_GRATIS").length;
  const countBelumBayar = dataForMetrics.filter(t => t.statusPembayaran === "PENDING").length;

  const filteredData = filteredByScope.filter(t => {
    // 1. Text Search Filter
    const matchesSearch = t.santri.nama.toLowerCase().includes(search.toLowerCase()) || t.noKwitansi.toLowerCase().includes(search.toLowerCase());

    // 2. Hide Rombongan Children (they are inside modal/rombongan table)
    const isNotRombonganChild = !t.rombonganId;

    // 3. Status Lunas Filter
    const isPaid = t.statusPembayaran === "PAID" || t.statusPembayaran === "KSU_GRATIS";
    const matchesLunas = filterLunas === "ALL"
      ? true
      : filterLunas === "LUNAS" ? isPaid : !isPaid;

    // 4. Kategori Filter (Baru/Lama)
    const isLama = t.noKwitansi?.includes("RENEW-");
    const matchesKategori = filterKategori === "ALL"
      ? true
      : filterKategori === "BARU" ? !isLama : isLama;

    // 5. Filter Program (Turots/Reguler)
    const matchesProgram = filterProgram === "ALL" ? true : t.program?.kategoriProgram === filterProgram;

    return matchesSearch && isNotRombonganChild && matchesLunas && matchesKategori && matchesProgram;
  });

  const filteredDaftarUlang = daftarUlang.filter(d => {
    // Filter Kategori: Daftar Ulang selalu LAMA
    if (filterKategori === "BARU") return false;

    // Filter Lunas: Daftar Ulang dari DB (yg muncul disini) selalu BELUM LUNAS
    if (filterLunas === "LUNAS") return false;

    // Sembunyikan dari tabel atas jika santri sudah memiliki tagihan Daftar Ulang online di tabel bawah
    const hasOnlineInvoice = filteredByScope.some(t => t.santriId === d.santriId && t.statusPembayaran === "PENDING");
    if (hasOnlineInvoice) return false;

    const matchesScope = filterScope === "AKTIF"
      ? activeDufah && d.dufahId === activeDufah.id
      : filterScope === "GLOBAL"
        ? true
        : d.dufahId?.toString() === filterScope;
    const matchesSearch = d.santri?.nama.toLowerCase().includes(search.toLowerCase());
    return matchesScope && matchesSearch;
  });

  // Data for Charts
  const pieData = [
    { name: 'Sudah Bayar', value: totalLunas },
    { name: 'Belum Lunas', value: totalPending }
  ];

  const barData = allDufah.map(d => {
    const income = transaksi
      .filter(t => {
        const matchesDufah = t.noKwitansi.includes(`-${d.id}-`) || t.noKwitansi.includes(`RENEW-${d.id}-`);
        const matchesPaid = t.statusPembayaran === "PAID";
        const matchesProgram = filterProgram === "ALL" ? true : t.program?.kategoriProgram === filterProgram;
        return matchesDufah && matchesPaid && matchesProgram;
      })
      .reduce((acc, t) => acc + t.totalTagihan, 0);
    return { name: d.nama, Pendapatan: income };
  });

  return (
    <Protect permission="view_keuangan">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gold-500/10 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gold-500">Meja Keuangan</h1>
            <p className="text-gray-400 mt-1">Pemantauan dan verifikasi pembayaran</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {((session?.user as any)?.permissions?.includes("verify_pendaftaran") || (session?.user as any)?.permissions?.includes("all_access")) && (
              <button
                onClick={() => setIsRombonganModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 flex-1 md:flex-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Import Rombongan
              </button>
            )}
            <button
              onClick={exportToExcel}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 flex-1 md:flex-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-dark-800 p-4 rounded-2xl border border-gold-500/10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={filterLunas}
              onChange={(e) => setFilterLunas(e.target.value)}
              className="bg-dark-900 text-gray-200 border border-gold-500/20 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-gold-500/50 cursor-pointer flex-1 md:flex-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="LUNAS">Sudah Lunas</option>
              <option value="BELUM">Belum Lunas</option>
            </select>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-dark-900 text-gray-200 border border-gold-500/20 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-gold-500/50 cursor-pointer flex-1 md:flex-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="BARU">Santri Baru</option>
              <option value="LAMA">Santri Lama (Renew)</option>
            </select>

            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="bg-dark-900 text-gold-500 font-bold border border-gold-500/30 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-gold-500/70 cursor-pointer flex-1 md:flex-none"
            >
              <option value="AKTIF">Duf'ah Aktif Saja</option>
              <option value="GLOBAL">Semua Data (Global)</option>
              {allDufah.map(d => (
                <option key={d.id} value={d.id.toString()}>{d.nama}</option>
              ))}
            </select>
          </div>

          {/* Toggle Program (Turots/Reguler) */}
          <div className="flex items-center bg-dark-900 border border-gold-500/20 rounded-xl overflow-hidden flex-1 md:flex-none">
            <button
              onClick={() => setFilterProgram("ALL")}
              className={`px-4 py-2.5 text-sm font-bold transition-all ${filterProgram === 'ALL' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterProgram("REGULER")}
              className={`px-4 py-2.5 text-sm font-bold transition-all ${filterProgram === 'REGULER' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Reguler
            </button>
            <button
              onClick={() => setFilterProgram("TUROTS")}
              className={`px-4 py-2.5 text-sm font-bold transition-all ${filterProgram === 'TUROTS' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Turots
            </button>
          </div>

          <div className="w-full lg:w-72 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari Nama / Invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-900 text-gray-200 border border-gold-500/20 pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 placeholder:text-gray-500 transition-all"
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
          <div className="bg-dark-800 border border-gold-500/20 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Pendaftar</p>
            <p className="text-2xl font-black text-white">{countTotalPendaftar} <span className="text-sm font-normal text-gray-500">Orang</span></p>
          </div>
          <div className="bg-dark-800 border border-green-500/20 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Sudah Bayar</p>
            <p className="text-2xl font-black text-green-400">{countSudahBayar} <span className="text-sm font-normal text-gray-500">Orang</span></p>
          </div>
          <div className="bg-dark-800 border border-red-500/20 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Belum Lunas</p>
            <p className="text-2xl font-black text-red-400">{countBelumBayar} <span className="text-sm font-normal text-gray-500">Orang</span></p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-800 border border-green-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl"></div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Nominal Sudah Ditransfer</p>
            <p className="text-3xl font-black text-green-400">Rp {new Intl.NumberFormat('id-ID').format(totalLunas)}</p>
          </div>
          <div className="bg-dark-800 border border-red-500/20 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Nominal Belum Ditransfer</p>
            <p className="text-3xl font-black text-red-400">Rp {new Intl.NumberFormat('id-ID').format(totalPending)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-dark-800 border border-gold-500/10 p-6 rounded-2xl shadow-lg h-[300px]">
            <h3 className="text-sm font-bold text-gray-400 mb-4 text-center">Rasio Pembayaran {selectedDufahLabel}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-dark-800 border border-gold-500/10 p-6 rounded-2xl shadow-lg lg:col-span-2 h-[300px]">
            <h3 className="text-sm font-bold text-gray-400 mb-4">Grafik Pendapatan per Duf'ah</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `Rp${val / 1000000}M`} />
                <Tooltip formatter={(value: any) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(value) || 0)}`} cursor={{ fill: '#2a2a2a' }} />
                <Bar dataKey="Pendapatan" fill="#d4af37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daftar Ulang Santri Lama Table */}
        {filteredDaftarUlang.length > 0 && (
          <div className="bg-dark-800 border border-blue-500/20 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 bg-blue-500/10 border-b border-blue-500/20 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-blue-400">Daftar Ulang Santri Lama (Menunggu Pembayaran)</h3>
                <p className="text-xs text-gray-400">Santri lama yang melanjutkan ke Duf'ah berikutnya namun belum melakukan konfirmasi transfer</p>
              </div>
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/30">
                {filteredDaftarUlang.length} Santri
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-dark-900 border-b border-blue-500/10">
                  <tr>
                    <th className="px-4 py-4 text-center w-12">No</th>
                    <th className="px-4 py-4">Duf'ah Tujuan</th>
                    <th className="px-4 py-4">Nama Santri</th>
                    <th className="px-4 py-4">Kamar / Sakan Saat Ini</th>
                    <th className="px-4 py-4 text-center">Status Lunas</th>
                    <th className="px-4 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDaftarUlang.map((d, index) => (
                    <tr key={d.id} className="border-b border-gray-800 hover:bg-dark-900/50 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="px-4 py-4 font-bold text-gold-400">{d.dufah?.nama}</td>
                      <td className="px-4 py-4 font-bold text-white">
                        {d.santri?.nama}
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">NIS: {d.santri?.nis || "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        {d.lemariId ? (
                          <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Slot Tersimpan</span>
                        ) : (
                          <span className="text-amber-400 italic">Antrean / Belum Plot</span>
                        )}
                        <div className="text-[10px] text-gray-500 mt-0.5">Bulan ke-{d.bulanKe}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-bold border border-red-500/30">PENDING</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {((session?.user as any)?.permissions?.includes("verify_pendaftaran") || (session?.user as any)?.permissions?.includes("all_access")) && (
                            <button
                              onClick={() => prosesVerifikasiDaftarUlang(d.id)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                            >
                              ✓ Konfirmasi Lunas
                            </button>
                          )}
                          {((session?.user as any)?.permissions?.includes("verify_pendaftaran") || (session?.user as any)?.permissions?.includes("all_access")) && (
                            <button
                              onClick={() => batalkanDaftarUlang(d.id)}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                              title="Batalkan / Lepas Kamar"
                            >
                              ✕ Batal
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rombongan Table */}
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
                      <td className="px-4 py-4 text-xs font-mono text-gray-400">{new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
                            <button
                              onClick={() => {
                                generateRombonganInvoicePdf(r).then(() => {
                                  swalSuccess("Berhasil", "Invoice berhasil diunduh");
                                }).catch((err) => {
                                  swalError("Gagal", "Gagal membuat invoice");
                                });
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                            >
                              ↓ Invoice
                            </button>
                            {((session?.user as any)?.permissions?.includes("all_access")) && (
                              <button
                                onClick={() => hapusRombongan(r.id, r.nama)}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                              >
                                ✕ Hapus
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

        {/* Data Table */}
        <div className="bg-dark-800 border border-gold-500/10 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-dark-900 border-b border-gold-500/20">
                <tr>
                  <th className="px-4 py-4 text-center w-12">No</th>
                  <th className="px-4 py-4">Tgl Mendaftar</th>
                  <th className="px-4 py-4">Nama Santri</th>
                  <th className="px-4 py-4">Program</th>
                  <th className="px-4 py-4 text-right">Biaya (Rp)</th>
                  <th className="px-4 py-4 text-center">Pencatat</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">Tidak ada data pendaftaran di {selectedDufahLabel}</td>
                  </tr>
                ) : (
                  filteredData.map((t, index) => (
                    <tr key={t.id} className="border-b border-gray-800 hover:bg-dark-900/50 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-gray-400">{index + 1}</td>
                      <td className="px-4 py-4 text-xs font-mono text-gray-400">{new Date(t.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-4 font-bold text-white">
                        {t.santri.nama}
                        <div className="text-[10px] text-gray-500 font-mono mt-1">{t.noKwitansi}</div>
                      </td>
                      <td className="px-4 py-4">
                        {t.statusPembayaran === "KSU_GRATIS" ? (
                          <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">Beasiswa KSU</span>
                        ) : (
                          <>
                            {t.program.nama}
                            <div className="text-xs text-gold-500 mt-0.5">{t.program.durasiBulan} Bulan</div>
                            {t.dufahTujuanId && (
                              <div className="text-[10px] font-bold text-blue-400 mt-0.5">
                                Mulai Aktif: {allDufah.find(d => d.id === t.dufahTujuanId)?.nama || `Duf'ah ${t.dufahTujuanId}`}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm">
                        {t.statusPembayaran === "KSU_GRATIS" ? (
                          <span className="text-purple-400 font-bold">GRATIS</span>
                        ) : t.statusPembayaran === "KLAIM_PAKET" ? (
                          <span className="text-emerald-400 font-bold">KLAIM (Rp 0)</span>
                        ) : (
                          <>
                            {new Intl.NumberFormat('id-ID').format(t.totalTagihan)}
                            <div className="text-[10px] text-gray-500 mt-0.5">Kode: +{t.kodeUnik}</div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-xs font-bold text-blue-400">
                        {t.statusPembayaran === "KLAIM_PAKET" ? "Sistem (Otomatis)" : (t.admin?.nama || "-")}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {t.statusPembayaran === "PAID" ? (
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs font-bold border border-green-500/30">LUNAS</span>
                        ) : t.statusPembayaran === "KLAIM_PAKET" ? (
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-xs font-bold border border-emerald-500/30">KLAIM PAKET</span>
                        ) : t.statusPembayaran === "KSU_GRATIS" ? (
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-md text-xs font-bold border border-purple-500/30">LUNAS (KSU)</span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-bold border border-red-500/30">PENDING</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {t.statusPembayaran === "PENDING" && (
                          <div className="flex gap-2 justify-center">
                            {((session?.user as any)?.permissions?.includes("verify_pendaftaran") || (session?.user as any)?.permissions?.includes("all_access")) && (
                              <button
                                onClick={() => prosesVerifikasi(t.id, false)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                              >
                                ✓ Acc
                              </button>
                            )}
                            <button
                              onClick={() => handleTagihWa(t.santri.noWaOrtu, t.santri.nama, t.totalTagihan)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                            >
                              WA
                            </button>
                            {((session?.user as any)?.permissions?.includes("bypass_ksu") || (session?.user as any)?.permissions?.includes("all_access")) && (
                              <button
                                onClick={() => prosesVerifikasi(t.id, true)}
                                disabled={loading}
                                title="Bypass tanpa bayar untuk santri Beasiswa/KSU"
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                              >
                                KSU
                              </button>
                            )}
                            <button
                              onClick={() => {
                                generateRegistrationPdf({
                                  santri: t.santri,
                                  transaksi: t,
                                  program: t.program,
                                  dufah: allDufah.find(d => d.id === t.dufahTujuanId),
                                  isRenew: t.noKwitansi?.includes("RENEW"),
                                }).then(() => {
                                  swalSuccess("Berhasil", "Invoice berhasil diunduh");
                                }).catch((err) => {
                                  swalError("Gagal", "Gagal membuat invoice");
                                });
                              }}
                              title="Download Invoice"
                              className="bg-gold-600 hover:bg-gold-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                            >
                              ↓ Inv
                            </button>
                          </div>
                        )}
                        {((session?.user as any)?.permissions?.includes("all_access")) && (
                          <div className={`flex justify-center ${t.statusPembayaran === "PENDING" ? "mt-2" : ""}`}>
                            <button
                              onClick={() => hapusTransaksi(t.id, t.santri.nama)}
                              disabled={loading}
                              title="Hapus Data (Super Admin)"
                              className="bg-red-900/80 hover:bg-red-600 text-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 border border-red-500/30 w-full justify-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">File Data Excel (.xlsx)</label>
                  <button
                    onClick={downloadTemplate}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Template
                  </button>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                />
                {parsedRombonganData.length > 0 && (
                  <p className="mt-2 text-xs text-green-400">✓ Berhasil membaca {parsedRombonganData.length} baris data santri.</p>
                )}
                <p className="mt-2 text-xs text-gray-500 italic">Kolom yang wajib ada di Excel: Nama. Kolom lainnya: Gender, TempatLahir, TanggalLahir, NamaOrtu, NoWaOrtu, NoWaSantri, Provinsi, Kabupaten, Kecamatan, Desa, DetailAlamat.</p>
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

    </Protect>
  );
}
