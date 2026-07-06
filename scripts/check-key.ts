import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

async function main() {
  const role = await prisma.role.findUnique({
      where: { nama: "Sistem Eksternal" },
      include: {
          permissions: { include: { permission: true } },
          apiKeys: true
      }
  });

  if (!role) throw new Error("Role not found");

  // Delete existing API keys for this role
  await prisma.apiKey.deleteMany({ where: { roleId: role.id } });

  const generatedKey = "sk_siakad_" + crypto.randomBytes(32).toString('hex')
  const apiKey = await prisma.apiKey.create({
    data: {
      key: generatedKey,
      namaProject: "SIAKAD Santri Portal",
      roleId: role.id,
      isActive: true
    }
  })
  console.log("--------------------------------------------------")
  console.log("✅ API KEY BARU BERHASIL DIBUAT DENGAN AMAN!")
  console.log("X-API-KEY SIAKAD ANDA: ->", generatedKey, "<-")
  console.log("Mohon simpan key ini baik-baik. Key ini memberikan akses integrasi penuh.")
  console.log("--------------------------------------------------")
}

main().catch(console.error).finally(() => prisma.$disconnect())
