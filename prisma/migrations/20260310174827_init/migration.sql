-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TIM_IDCARD', 'TIM_ASRAMA', 'MUASIS');

-- CreateEnum
CREATE TYPE "TipeSantri" AS ENUM ('REGULER', 'KSU');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Santri" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "tipe" "TipeSantri" NOT NULL DEFAULT 'REGULER',

    CONSTRAINT "Santri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dufah" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Dufah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sakan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Sakan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kamar" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sakanId" TEXT NOT NULL,

    CONSTRAINT "Kamar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lemari" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kamarId" TEXT NOT NULL,

    CONSTRAINT "Lemari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registrasi" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "dufahId" TEXT NOT NULL,
    "isLanjut" BOOLEAN NOT NULL DEFAULT false,
    "isCekIdCard" BOOLEAN NOT NULL DEFAULT false,
    "isKonfirmasiSakan" BOOLEAN NOT NULL DEFAULT false,
    "lemariId" TEXT,
    "riwayatSakan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registrasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Registrasi_santriId_dufahId_key" ON "Registrasi"("santriId", "dufahId");

-- AddForeignKey
ALTER TABLE "Kamar" ADD CONSTRAINT "Kamar_sakanId_fkey" FOREIGN KEY ("sakanId") REFERENCES "Sakan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lemari" ADD CONSTRAINT "Lemari_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registrasi" ADD CONSTRAINT "Registrasi_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registrasi" ADD CONSTRAINT "Registrasi_dufahId_fkey" FOREIGN KEY ("dufahId") REFERENCES "Dufah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registrasi" ADD CONSTRAINT "Registrasi_lemariId_fkey" FOREIGN KEY ("lemariId") REFERENCES "Lemari"("id") ON DELETE SET NULL ON UPDATE CASCADE;
