import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const santri = await prisma.santri.findFirst({
      where: { nama: { contains: "Himmatul Ulya", mode: "insensitive" } },
      include: {
        riwayatDufah: {
          include: {
            dufah: true,
            lemari: {
              include: { kamar: { include: { sakan: true } } }
            }
          }
        },
        transaksi: true
      }
    });

    const activeDufah = await prisma.dufah.findFirst({ where: { isActive: true } });

    return NextResponse.json({
      santri,
      activeDufah
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
