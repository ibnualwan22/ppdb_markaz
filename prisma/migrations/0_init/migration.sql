-- CreateTable
CREATE TABLE "Sakan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'BANIN',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sakan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kamar" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sakanId" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Kamar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lemari" (
    "id" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "kamarId" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lemari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Santri" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'BANIN',
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "nis" TEXT,
    "nik" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "namaOrtu" TEXT,
    "noWaOrtu" TEXT,
    "noWaSantri" TEXT,
    "provinsi" TEXT,
    "kabupaten" TEXT,
    "kecamatan" TEXT,
    "desa" TEXT,
    "detailAlamat" TEXT,
    "batasAktifDufah" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Santri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dufah" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isTahunBaru" BOOLEAN NOT NULL DEFAULT false,
    "tanggalBuka" TIMESTAMP(3),
    "tanggalTutup" TIMESTAMP(3),

    CONSTRAINT "Dufah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiwayatDufah" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "dufahId" INTEGER NOT NULL,
    "lemariId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRE_LIST',
    "isIdCardTaken" BOOLEAN NOT NULL DEFAULT false,
    "nomorIdCard" INTEGER,
    "isDresscodeTaken" BOOLEAN NOT NULL DEFAULT false,
    "ukuranDresscode" TEXT,
    "isToteBagTaken" BOOLEAN NOT NULL DEFAULT false,
    "isPinTaken" BOOLEAN NOT NULL DEFAULT false,
    "isSongkokKhimarTaken" BOOLEAN NOT NULL DEFAULT false,
    "ukuranSongkok" TEXT,
    "isMalzamahTaken" BOOLEAN NOT NULL DEFAULT false,
    "isTabirotTaken" BOOLEAN NOT NULL DEFAULT false,
    "bulanKe" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktuAmbilKartu" TIMESTAMP(3),

    CONSTRAINT "RiwayatDufah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "namaAksi" TEXT NOT NULL,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namaProject" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "harga" DOUBLE PRECISION NOT NULL,
    "durasiBulan" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiPendaftaran" (
    "id" TEXT NOT NULL,
    "noKwitansi" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "nominalProgram" DOUBLE PRECISION NOT NULL,
    "kodeUnik" INTEGER NOT NULL,
    "totalTagihan" DOUBLE PRECISION NOT NULL,
    "statusPembayaran" TEXT NOT NULL DEFAULT 'PENDING',
    "diverifikasiOleh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktuLunas" TIMESTAMP(3),

    CONSTRAINT "TransaksiPendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Santri_nis_key" ON "Santri"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "Santri_nik_key" ON "Santri"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "RiwayatDufah_santriId_dufahId_key" ON "RiwayatDufah"("santriId", "dufahId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_nama_key" ON "Role"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_namaAksi_key" ON "Permission"("namaAksi");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TransaksiPendaftaran_noKwitansi_key" ON "TransaksiPendaftaran"("noKwitansi");

-- AddForeignKey
ALTER TABLE "Kamar" ADD CONSTRAINT "Kamar_sakanId_fkey" FOREIGN KEY ("sakanId") REFERENCES "Sakan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lemari" ADD CONSTRAINT "Lemari_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "Kamar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatDufah" ADD CONSTRAINT "RiwayatDufah_lemariId_fkey" FOREIGN KEY ("lemariId") REFERENCES "Lemari"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatDufah" ADD CONSTRAINT "RiwayatDufah_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatDufah" ADD CONSTRAINT "RiwayatDufah_dufahId_fkey" FOREIGN KEY ("dufahId") REFERENCES "Dufah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiPendaftaran" ADD CONSTRAINT "TransaksiPendaftaran_diverifikasiOleh_fkey" FOREIGN KEY ("diverifikasiOleh") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiPendaftaran" ADD CONSTRAINT "TransaksiPendaftaran_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiPendaftaran" ADD CONSTRAINT "TransaksiPendaftaran_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

