import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const santri = await prisma.santri.findUnique({
      where: { nis: "90181105075" }
  });
  console.dir(santri, {depth: null});
}
main().catch(console.error).finally(() => prisma.$disconnect())
