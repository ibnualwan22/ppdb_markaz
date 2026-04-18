import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateRegistrationPdf = async (data: {
  santri: any;
  transaksi: any;
  program: any;
  isRenew?: boolean;
}) => {
  return new Promise<void>((resolve, reject) => {
    try {
      const doc = new jsPDF();

      const img = new Image();
      img.src = "/images/logo.png";

      const renderPdf = (hasImage: boolean) => {
        if (hasImage) {
          doc.addImage(img, "PNG", 14, 10, 20, 20);
          doc.setFontSize(18);
          doc.text("MARKAZ ARABIYYAH", 40, 18);
          doc.setFontSize(10);
          doc.text("Pusat Pembelajaran Bahasa Arab", 40, 24);
        } else {
          doc.setFontSize(18);
          doc.text("MARKAZ ARABIYYAH", 14, 18);
          doc.setFontSize(10);
          doc.text("Pusat Pembelajaran Bahasa Arab", 14, 24);
        }

        doc.line(14, 32, 196, 32);

        doc.setFontSize(14);
        doc.text(data.isRenew ? "BUKTI DAFTAR ULANG" : "BUKTI PENDAFTARAN", 105, 42, { align: "center" });

        const tl = new Date(data.santri.tanggalLahir).toLocaleDateString("id-ID");

        autoTable(doc, {
          startY: 50,
          theme: "plain",
          styles: { cellPadding: 1, fontSize: 10 },
          columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 5 }, 2: { cellWidth: 'auto' } },
          body: [
            ["Nama Lengkap", ":", data.santri.nama],
            ["NIK / NIS Lama", ":", data.santri.nik || data.santri.nis || "-"],
            ["Jenis Kelamin", ":", data.santri.gender === "BANIN" ? "Laki-laki" : "Perempuan"],
            ["TTL", ":", `${data.santri.tempatLahir || "-"}, ${tl}`],
            ["No WhatsApp Wali", ":", data.santri.noWaOrtu || "-"],
            ["Alamat", ":", data.santri.detailAlamat || "-"],
          ]
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          theme: "grid",
          headStyles: { fillColor: [212, 175, 55] },
          head: [["Program", "Durasi", "Nominal Tagihan"]],
          body: [
            [
              data.program.nama,
              `${data.program.durasiBulan} Duf'ah`,
              `Rp ${new Intl.NumberFormat('id-ID').format(data.transaksi.totalTagihan)}`
            ]
          ]
        });

        // Rekening detail
        const yRekening = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text("Silakan transfer ke:", 14, yRekening);
        doc.setFont("helvetica", "bold");
        doc.text("BANK BRI a.n Markaz Arabiyah: 0555-01-001108-569", 14, yRekening + 5);
        doc.setFont("helvetica", "normal");

        doc.setFontSize(8);
        doc.text("*Pastikan transfer tepat hingga 3 digit terakhir (" + data.transaksi.kodeUnik + ") untuk verifikasi otomatis", 14, yRekening + 10);

        // Signature
        const finalY = yRekening + 30;
        doc.setFontSize(10);
        doc.text("Mengetahui,", 150, finalY, { align: "center" });
        doc.text("Santri / Wali", 150, finalY + 5, { align: "center" });
        doc.line(130, finalY + 25, 170, finalY + 25);

        doc.save(`Bukti_${data.isRenew ? 'DaftarUlang' : 'Pendaftaran'}_${data.santri.nama.replace(/\s+/g, '_')}.pdf`);
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
