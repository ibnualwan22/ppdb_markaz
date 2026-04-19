/*
  Warnings:

  - You are about to drop the column `nik` on the `Santri` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Santri_nik_key";

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "tanggalMulaiDefault" TEXT,
ADD COLUMN     "tanggalTutupDefault" TEXT;

-- AlterTable
ALTER TABLE "Santri" DROP COLUMN "nik",
ADD COLUMN     "expiredDufahId" INTEGER,
ADD COLUMN     "isCuti" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "saldoDufah" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TransaksiPendaftaran" ADD COLUMN     "dufahTujuanId" INTEGER;

-- AddForeignKey
ALTER TABLE "TransaksiPendaftaran" ADD CONSTRAINT "TransaksiPendaftaran_dufahTujuanId_fkey" FOREIGN KEY ("dufahTujuanId") REFERENCES "Dufah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
