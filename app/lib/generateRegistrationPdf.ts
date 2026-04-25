import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function terbilang(angka: number): string {
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan",
    "Sepuluh", "Sebelas", "Dua Belas", "Tiga Belas", "Empat Belas", "Lima Belas",
    "Enam Belas", "Tujuh Belas", "Delapan Belas", "Sembilan Belas"];
  const puluhan = ["", "", "Dua Puluh", "Tiga Puluh", "Empat Puluh", "Lima Puluh",
    "Enam Puluh", "Tujuh Puluh", "Delapan Puluh", "Sembilan Puluh"];

  if (angka < 20) return satuan[angka];
  if (angka < 100) return puluhan[Math.floor(angka / 10)] + (angka % 10 ? " " + satuan[angka % 10] : "");
  if (angka < 200) return "Seratus" + (angka % 100 ? " " + terbilang(angka % 100) : "");
  if (angka < 1000) return satuan[Math.floor(angka / 100)] + " Ratus" + (angka % 100 ? " " + terbilang(angka % 100) : "");
  if (angka < 2000) return "Seribu" + (angka % 1000 ? " " + terbilang(angka % 1000) : "");
  if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + " Ribu" + (angka % 1000 ? " " + terbilang(angka % 1000) : "");
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + " Juta" + (angka % 1000000 ? " " + terbilang(angka % 1000000) : "");
  return terbilang(Math.floor(angka / 1000000000)) + " Miliar" + (angka % 1000000000 ? " " + terbilang(angka % 1000000000) : "");
}

function formatRupiah(angka: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(angka);
}

function formatTanggal(date: Date): string {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export const generateRegistrationPdf = async (data: {
  santri: any;
  transaksi: any;
  program: any;
  isRenew?: boolean;
  noKwitansi?: string;
}) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const marginL = 14;
      const marginR = 14;
      const contentW = pageW - marginL - marginR;
      const goldColor: [number, number, number] = [212, 175, 55];
      const darkColor: [number, number, number] = [30, 30, 30];

      const noKwitansi = data.noKwitansi ?? `KWM-${Date.now()}`;
      const tanggalInvoice = formatTanggal(new Date());
      const totalTagihan: number = data.transaksi.totalTagihan;
      const terbilangText = terbilang(totalTagihan) + " Rupiah";

      const img = new Image();
      img.src = "/images/logo.png";

      const renderPdf = (hasImage: boolean) => {
        // ─── HEADER ───────────────────────────────────────────────
        if (hasImage) {
          doc.addImage(img, "PNG", marginL, 8, 18, 18);
        }
        const textX = hasImage ? marginL + 21 : marginL;

        doc.setTextColor(...darkColor);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("MARKAZ ARABIYAH", textX, 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Berbasis Multiple Intelligences", textX, 20);

        // Gold top border line
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(1);
        doc.line(marginL, 29, pageW - marginR, 29);

        // ─── INVOICE TITLE ────────────────────────────────────────
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(...goldColor);
        doc.text("INVOICE", pageW - marginR, 15, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...darkColor);
        doc.text(data.isRenew ? "DAFTAR ULANG" : "PENDAFTARAN", pageW - marginR, 21, { align: "right" });

        // ─── KWITANSI & TANGGAL ───────────────────────────────────
        let y = 37;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("No Kwitansi :", marginL, y);
        doc.setFont("helvetica", "normal");
        doc.text(noKwitansi, marginL + 32, y);

        doc.setFont("helvetica", "bold");
        doc.text("Tanggal :", pageW / 2 + 10, y);
        doc.setFont("helvetica", "normal");
        doc.text(tanggalInvoice, pageW / 2 + 28, y);

        // ─── DATA TAGIHAN ─────────────────────────────────────────
        y += 8;
        const tl = new Date(data.santri.tanggalLahir).toLocaleDateString("id-ID");
        const labelX = marginL;
        const sepX = marginL + 38;
        const valX = marginL + 42;

        const rows: [string, string][] = [
          ["Tagihan untuk", data.santri.nama],
          ["NIK / NIS", data.santri.nik || data.santri.nis || "-"],
          ["Jenis Kelamin", data.santri.gender === "BANIN" ? "Laki-laki" : "Perempuan"],
          ["TTL", `${data.santri.tempatLahir || "-"}, ${tl}`],
          ["No WhatsApp Wali", data.santri.noWaOrtu || "-"],
          ["Alamat", data.santri.detailAlamat || "-"],
        ];

        doc.setFontSize(9);
        for (const [label, val] of rows) {
          doc.setFont("helvetica", "bold");
          doc.text(label, labelX, y);
          doc.setFont("helvetica", "normal");
          doc.text(":", sepX, y);
          // wrap long text
          const wrapped = doc.splitTextToSize(val, contentW - 45);
          doc.text(wrapped, valX, y);
          y += 5.5 * (wrapped.length > 1 ? wrapped.length * 0.85 : 1);
        }

        // ─── SEJUMLAH ─────────────────────────────────────────────
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.text("Sejumlah", labelX, y);
        doc.text(":", sepX, y);
        doc.setTextColor(...goldColor);
        doc.text(formatRupiah(totalTagihan), valX, y);
        doc.setTextColor(...darkColor);
        y += 5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text(`(${terbilangText})`, valX, y);

        // ─── DETAIL TAGIHAN TABLE ─────────────────────────────────
        y += 7;
        autoTable(doc, {
          startY: y,
          theme: "grid",
          tableWidth: contentW,
          margin: { left: marginL, right: marginR },
          headStyles: {
            fillColor: goldColor,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            halign: "center",
          },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: contentW * 0.55 },
            1: { cellWidth: contentW * 0.25, halign: "right" },
            2: { cellWidth: contentW * 0.20, halign: "right" },
          },
          head: [["Detail Tagihan", "Harga", "Total"]],
          body: [
            [
              data.program.nama + `\n(${data.program.durasiBulan} Duf'ah)`,
              formatRupiah(totalTagihan),
              formatRupiah(totalTagihan),
            ],
          ],
          foot: [[{ content: "TOTAL", colSpan: 2, styles: { fontStyle: "bold", halign: "right" } },
          { content: formatRupiah(totalTagihan), styles: { fontStyle: "bold", halign: "right", textColor: goldColor } }]],
          footStyles: { fillColor: [245, 245, 245], fontSize: 9 },
        });

        y = (doc as any).lastAutoTable.finalY + 7;

        // ─── KODE UNIK ────────────────────────────────────────────
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120, 120, 120);
        doc.text(
          `*Pastikan transfer tepat hingga 3 digit terakhir (${data.transaksi.kodeUnik}) untuk verifikasi otomatis`,
          marginL, y
        );
        doc.setTextColor(...darkColor);

        // ─── PERNYATAAN PERSETUJUAN ───────────────────────────────
        y += 8;
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(0.3);
        doc.rect(marginL, y - 3, contentW, 12);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...darkColor);
        const statement = "Saya setuju untuk tidak merefund atau mengalihkan pembayaran ke orang lain dengan keadaan sadar.";
        const wrappedStatement = doc.splitTextToSize(statement, contentW - 6);
        doc.text(wrappedStatement, marginL + 3, y + 2.5);
        y += 16;

        // ─── REKENING PEMBAYARAN ──────────────────────────────────
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Rekening pembayaran:", marginL, y);
        doc.setFont("helvetica", "bold");
        doc.text("Bank BRI  No. Rek : 055501001108569  A/N Markaz Arabiyah", marginL, y + 5);
        doc.setFont("helvetica", "normal");

        // ─── TANDA TANGAN ─────────────────────────────────────────
        const sigX = pageW - marginR - 45;
        doc.setFontSize(9);
        doc.text(`Pare, ${tanggalInvoice}`, sigX + 22, y, { align: "center" });
        doc.text("Santri / Wali", sigX + 22, y + 5, { align: "center" });
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.3);
        doc.line(sigX, y + 22, sigX + 44, y + 22);
        doc.setFontSize(8.5);
        doc.text(data.santri.nama, sigX + 22, y + 26, { align: "center" });

        // ─── FOOTER ───────────────────────────────────────────────
        const footerY = 282;
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(0.8);
        doc.line(marginL, footerY - 2, pageW - marginR, footerY - 2);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text("Jalan Cempaka 32, Tegalsari, Tulungrejo, Pare, Kediri, Jawa Timur, Indonesia", marginL, footerY + 2);
        doc.text("081 212 887788  |  @markazarabiyah  |  markazarabiyah@gmail.com  |  www.markazarabiyah.com", marginL, footerY + 6.5);

        doc.save(`Invoice_${data.isRenew ? "DaftarUlang" : "Pendaftaran"}_${data.santri.nama.replace(/\s+/g, "_")}.pdf`);
        resolve();
      };

      img.onload = () => renderPdf(true);
      img.onerror = () => renderPdf(false);

    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
};