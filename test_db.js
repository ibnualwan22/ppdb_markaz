const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const santri = await prisma.santri.findFirst()
  console.log(santri.id)
}
main()
