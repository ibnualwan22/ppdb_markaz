import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import VerificationForm from "./components/VerificationForm";

export default async function VerifikasiDataPage() {
  const session: any = await getServerSession(authOptions);

  if (!session || session.user?.role !== "SANTRI") {
    redirect("/santri/login");
  }

  const santri = await prisma.santri.findUnique({
    where: { nis: session.user.username },
    select: {
      id: true,
      nama: true,
      tempatLahir: true,
      tanggalLahir: true,
      namaOrtu: true,
      isDataVerified: true,
    },
  });

  if (!santri) {
    redirect("/santri/login");
  }

  // Jika data sudah divalidasi/dikunci sebelumnya, kembalikan ke dashboard
  if (santri.isDataVerified) {
    redirect("/santri/dashboard");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Verifikasi Data <span className="text-gold-500">Syahadah</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Mohon sesuaikan data Anda secara permanen sesuai dengan yang tertulis di Kartu Keluarga (KK).
        </p>
      </div>

      <VerificationForm initialData={santri} />
    </>
  );
}
