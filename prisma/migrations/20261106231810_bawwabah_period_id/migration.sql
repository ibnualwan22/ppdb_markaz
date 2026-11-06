-- Tautkan baris Dufah ke periode Bawwabah (rancangan PPDB-pendaftaran,
-- 6 Nov 2026): satu baris Dufah dibuat dari satu draf Bawwabah, dan
-- idempotensi endpoint POST /api/bawwabah/dufah memakai kolom ini.
-- DOKUMENTASI SAJA — kolom dibuat via psql (deploy PPDB tidak menjalankan
-- migrate); JANGAN paksa insert baris history.
ALTER TABLE "Dufah" ADD COLUMN IF NOT EXISTS "bawwabahPeriodId" TEXT UNIQUE;
