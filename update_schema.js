const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('model Rombongan')) {
  // Add Rombongan model at the end
  schema += `
model Rombongan {
  id               String    @id @default(uuid())
  nama             String
  isMouSigned      Boolean   @default(false)
  diskonPersen     Float     @default(0)
  totalTagihan     Float
  statusPembayaran String    @default("PENDING")
  diverifikasiOleh String?
  waktuLunas       DateTime?
  createdAt        DateTime  @default(now())
  dufahTujuanId    Int?

  transaksi        TransaksiPendaftaran[]
  admin            User?     @relation(fields: [diverifikasiOleh], references: [id])
  dufahTujuan      Dufah?    @relation(fields: [dufahTujuanId], references: [id], onDelete: SetNull)
}
`;

  // Add rombonganId to TransaksiPendaftaran
  schema = schema.replace(
    '  dufahTujuan      Dufah?    @relation(fields: [dufahTujuanId], references: [id], onDelete: SetNull)',
    `  dufahTujuan      Dufah?    @relation(fields: [dufahTujuanId], references: [id], onDelete: SetNull)
  rombonganId      String?
  rombongan        Rombongan? @relation(fields: [rombonganId], references: [id])`
  );

  fs.writeFileSync('prisma/schema.prisma', schema);
  console.log("Schema updated");
} else {
  console.log("Schema already has Rombongan");
}
