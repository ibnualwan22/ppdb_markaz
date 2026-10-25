-- SSO Bawwabah -> PPDB: anti-replay token sekali pakai.
-- DOKUMENTASI SAJA: tabel dibuat via psql (deploy PPDB tidak menjalankan migrate).
CREATE TABLE IF NOT EXISTS "SsoConsumedToken" (
  "jti" TEXT PRIMARY KEY,
  "consumedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
