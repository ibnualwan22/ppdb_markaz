import { PrismaClient } from "@prisma/client"
import crypto from "crypto"

const prisma = new PrismaClient()

async function main() {
  const permName = "integrasi_siakad"
  
  // 1. Create permission
  let permission = await prisma.permission.findUnique({ where: { namaAksi: permName } })
  if(!permission) {
     permission = await prisma.permission.create({
       data: { namaAksi: permName, deskripsi: "Dapat mengakses API integrasi dari platform eksternal seperti SIAKAD" }
     })
  }

  // 2. Create role
  let role = await prisma.role.findUnique({ where: { nama: "Sistem Eksternal" } })
  if (!role) {
    role = await prisma.role.create({
       data: { nama: "Sistem Eksternal" }
    })
  }
  
  // Link role & permission
  const exists = await prisma.rolePermission.findUnique({ 
    where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }
  })

  if (!exists) {
     await prisma.rolePermission.create({
       data: { roleId: role.id, permissionId: permission.id }
     })
  }

  // 3. Create API Key if it doesn't exist for this role
  let apiKey = await prisma.apiKey.findFirst({ where: { roleId: role.id } })
  if (!apiKey) {
     const generatedKey = "sk_siakad_" + crypto.randomBytes(32).toString('hex')
     apiKey = await prisma.apiKey.create({
       data: {
         key: generatedKey,
         namaProject: "SIAKAD Santri Portal",
         roleId: role.id,
         isActive: true
       }
     })
     console.log("--------------------------------------------------")
     console.log("✅ API KEY BERHASIL DIBUAT DENGAN AMAN!")
     console.log("X-API-KEY SIAKAD ANDA: ->", generatedKey, "<-")
     console.log("Mohon simpan key ini baik-baik. Key ini memberikan akses integrasi penuh.")
     console.log("--------------------------------------------------")
  } else {
     console.log("--------------------------------------------------")
     console.log("API Key untuk integrasi SIAKAD sudah ada di database.")
     console.log("X-API-KEY: ->", apiKey.key, "<-")
     console.log("--------------------------------------------------")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
