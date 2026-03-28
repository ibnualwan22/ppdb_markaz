import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("nama");

    if (!keyword || keyword.length < 3) return NextResponse.json([]);

    const santriMati = await prisma.santri.findMany({
      where: {
        nama: { contains: keyword, mode: "insensitive" },
        isAktif: false,
      },
      take: 10,
      select: { 
        id: true, 
        nama: true, 
        gender: true, 
        kategori: true,
        riwayat: {
          orderBy: { id: 'desc' },
          take: 1,
          select: {
            dufah: { select: { nama: true } },
            lemari: {
              select: {
                nomor: true,
                kamar: {
                  select: {
                    nama: true,
                    sakan: { select: { nama: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { nama: 'asc' }
    });

    return NextResponse.json(santriMati);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mencari santri non-aktif" }, { status: 500 });
  }
}
