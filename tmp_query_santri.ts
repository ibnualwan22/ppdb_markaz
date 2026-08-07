import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const santri = await prisma.santri.findUnique({
    where: { nis: '89270604095' },
    include: {
      riwayat: {
        include: {
          dufah: true,
          lemari: {
            include: {
              kamar: {
                include: {
                  sakan: true
                }
              }
            }
          }
        },
        orderBy: {
          dufah: {
            id: 'desc'
          }
        }
      }
    }
  })
  
  if (santri) {
    console.log(JSON.stringify(santri, null, 2))
  } else {
    console.log("Santri not found")
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
