-- Buat tabel RolloverLog (Fase 7 Bawwabah): kunci idempotensi + jejak
-- aktivasi dufah yang dipicu Bawwabah.
-- DOKUMENTASI SAJA — tabel dibuat via psql (deploy PPDB tidak menjalankan
-- migrate); JANGAN paksa insert baris history.
CREATE TABLE IF NOT EXISTS "RolloverLog" (
  "id" SERIAL PRIMARY KEY,
  "dufahId" INTEGER NOT NULL REFERENCES "Dufah"("id"),
  "idempotencyKey" TEXT NOT NULL UNIQUE,
  "triggeredBy" TEXT NOT NULL DEFAULT 'bawwabah',
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "finishedAt" TIMESTAMPTZ,
  "summary" JSONB
);
CREATE INDEX IF NOT EXISTS "RolloverLog_dufahId_idx" ON "RolloverLog" ("dufahId");
