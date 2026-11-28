// Helper aturan Akbarnas Bulan 1 vs Bulan 2 & perhitungan kekurangan durasi Daftar Ulang

export const TARIF_REGULER_TANPA_ATRIBUT_PER_BULAN = 1_100_000;
export const BIAYA_ATRIBUT_TAMBAHAN = 100_000;

export function isAkbarnasProgramName(nama?: string | null): boolean {
  return (nama || "").toLowerCase().includes("akbarnas");
}

export function isAkbarnasBulan2OnlyProgram(nama?: string | null): boolean {
  const lower = (nama || "").toLowerCase();
  return lower.includes("akbarnas") && (lower.includes("bulan ke 2") || lower.includes("bulan 2") || lower.includes("b2"));
}

export function isRegulerOrAkbarnas(program: { nama?: string | null; kategoriProgram?: string | null }): boolean {
  if (isAkbarnasProgramName(program.nama)) return true;
  const kat = (program.kategoriProgram || "").trim().toUpperCase();
  return kat === "" || kat === "REGULER";
}

export type DaftarUlangPricingMode = "KLAIM" | "KEKURANGAN" | "PENUH";

export type DaftarUlangPricingResult = {
  mode: DaftarUlangPricingMode;
  bisaKlaimGratis: boolean;
  durasiBulan: number;
  requiredBulan: number;
  sisaKuota: number;
  kekuranganBulan: number;
  jumlahBulanBayar: number;
  tarifPerBulan: number;
  nominalTanpaAtribut: number;
  nominalDenganAtribut: number;
  nominalFinal: number;
};

/**
 * Menghitung apakah santri bisa klaim gratis, harus bayar kekurangan bulan, atau bayar penuh.
 *
 * - Khusus Reguler (Markaz Arabiyah) & Akbarnas:
 *   - Jika 0 < sisaKuota < requiredBulan -> mode "KEKURANGAN":
 *     kekuranganBulan = requiredBulan - sisaKuota
 *     tanpa atribut = kekuranganBulan * Rp 1.100.000
 *     dengan atribut = (kekuranganBulan * Rp 1.100.000) + Rp 100.000
 *   - Jika sisaKuota >= requiredBulan -> mode "KLAIM" (Rp 0)
 *   - Jika sisaKuota === 0 -> mode "PENUH" (harga program - 100rb tanpa atribut, harga penuh dengan atribut)
 *
 * - Untuk non-Reguler (Turats / Hufadz / 2MINGGU):
 *   - Jika sisaKuota >= requiredBulan -> mode "KLAIM" (Rp 0)
 *   - Jika 0 < sisaKuota < requiredBulan -> mode "KEKURANGAN" (prorata harga program tanpa atribut / durasi)
 *   - Jika sisaKuota === 0 -> mode "PENUH"
 */
export function computeDaftarUlangPricing(params: {
  program: {
    nama: string;
    kategoriProgram?: string | null;
    harga: number;
    durasiBulan: number;
  };
  sisaKuota: number;
  isBeliAtribut?: boolean;
  targetAkbarnasBulan?: number;
  santriIsAkbarnasBulan1?: boolean;
}): DaftarUlangPricingResult {
  const {
    program,
    sisaKuota: rawSisa,
    isBeliAtribut = false,
    targetAkbarnasBulan = 1,
    santriIsAkbarnasBulan1 = false,
  } = params;

  const sisaKuota = Math.max(0, Math.floor(rawSisa || 0));
  const durasiBulan = Math.max(1, Number(program.durasiBulan) || 1);

  // Jika santri Akbarnas Bulan 1 melanjutkan ke Bulan 2 pada Duf'ah target Bulan 2,
  // durasi yang dibutuhkan untuk bulan ke-2 adalah 1 bulan (sisa paket 2 bulan mereka).
  const isContinuingAkbarnasB2 =
    isAkbarnasProgramName(program.nama) &&
    targetAkbarnasBulan === 2 &&
    santriIsAkbarnasBulan1;

  const requiredBulan = isContinuingAkbarnasB2 ? 1 : durasiBulan;

  const regulerMode = isRegulerOrAkbarnas(program);
  const tarifPerBulan = regulerMode
    ? TARIF_REGULER_TANPA_ATRIBUT_PER_BULAN
    : Math.round(Math.max(0, program.harga - BIAYA_ATRIBUT_TAMBAHAN) / durasiBulan);

  // 1. Sisa kuota cukup untuk seluruh durasi program -> KLAIM GRATIS (Rp 0)
  if (sisaKuota >= requiredBulan) {
    return {
      mode: "KLAIM",
      bisaKlaimGratis: true,
      durasiBulan,
      requiredBulan,
      sisaKuota,
      kekuranganBulan: 0,
      jumlahBulanBayar: 0,
      tarifPerBulan,
      nominalTanpaAtribut: 0,
      nominalDenganAtribut: 0,
      nominalFinal: 0,
    };
  }

  // 2. Sisa kuota ada (> 0) TAPI kurang dari durasi program -> BAYAR KEKURANGAN
  if (sisaKuota > 0 && sisaKuota < requiredBulan) {
    const kekuranganBulan = requiredBulan - sisaKuota;
    const nominalTanpaAtribut = kekuranganBulan * tarifPerBulan;
    const nominalDenganAtribut = nominalTanpaAtribut + BIAYA_ATRIBUT_TAMBAHAN;
    return {
      mode: "KEKURANGAN",
      bisaKlaimGratis: false,
      durasiBulan,
      requiredBulan,
      sisaKuota,
      kekuranganBulan,
      jumlahBulanBayar: kekuranganBulan,
      tarifPerBulan,
      nominalTanpaAtribut,
      nominalDenganAtribut,
      nominalFinal: isBeliAtribut ? nominalDenganAtribut : nominalTanpaAtribut,
    };
  }

  // 3. Sisa kuota habis (0) -> DAFTAR ULANG PENUH
  const nominalTanpaAtribut = isContinuingAkbarnasB2
    ? tarifPerBulan
    : Math.max(0, program.harga - BIAYA_ATRIBUT_TAMBAHAN);
  const nominalDenganAtribut = isContinuingAkbarnasB2
    ? tarifPerBulan + BIAYA_ATRIBUT_TAMBAHAN
    : Math.max(0, program.harga);

  return {
    mode: "PENUH",
    bisaKlaimGratis: false,
    durasiBulan,
    requiredBulan,
    sisaKuota: 0,
    kekuranganBulan: requiredBulan,
    jumlahBulanBayar: requiredBulan,
    tarifPerBulan,
    nominalTanpaAtribut,
    nominalDenganAtribut,
    nominalFinal: isBeliAtribut ? nominalDenganAtribut : nominalTanpaAtribut,
  };
}
