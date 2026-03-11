import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();



export async function GET() {
  try {
    // Cari duf'ah aktif
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });

    const dataSakan = await prisma.sakan.findMany({
      include: {
        kamar: {
          include: {
            lemari: {
              include: {
                // Tarik data penghuni KHUSUS untuk bulan ini
                penghuni: {
                  where: {
                    dufahId: dufahAktif?.id || -1
                  },
                  include: { santri: { select: { nama: true, kategori: true } } }
                }
              }
            }
          }
        }
      },
      orderBy: { nama: 'asc' }
    });
    
    return NextResponse.json(dataSakan);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data Sakan" }, { status: 500 });
  }
}


// Fungsi POST: Untuk Admin menambah gedung/Sakan baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama } = body;

    const sakanBaru = await prisma.sakan.create({
      data: {
        nama
      }
    });

    return NextResponse.json(sakanBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat Sakan baru" }, { status: 500 });
  }
}