import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const perms = await prisma.permission.findMany()
  console.log("All Permissions:", perms.map(p => p.namaAksi).join(', '))
}
main().catch(console.error).finally(() => prisma.$disconnect())
