import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAkbarnasProgramName, isAkbarnasBulan2OnlyProgram } from "@/lib/akbarnas-daftar-ulang";

export async function GET() {
  try {
    const [programs, allDufahs] = await Promise.all([
      prisma.program.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dufah.findMany({
        orderBy: { id: "desc" },
        select: { id: true, akbarnasBulan: true, tanggalBuka: true, tanggalTutup: true, isActive: true },
      }),
    ]);

    const now = new Date();
    const openDufah =
      allDufahs.find(
        (df) =>
          df.tanggalBuka &&
          df.tanggalTutup &&
          now >= new Date(df.tanggalBuka) &&
          now <= new Date(df.tanggalTutup)
      ) || allDufahs[0];

    const isTargetAkbarnasBulan2 = openDufah?.akbarnasBulan === 2;

    const visiblePrograms = programs.filter((p) => {
      if (isAkbarnasBulan2OnlyProgram(p.nama)) return false;
      if (isTargetAkbarnasBulan2 && isAkbarnasProgramName(p.nama)) return false;
      return true;
    });

    return NextResponse.json(visiblePrograms);
  } catch (error) {
    console.error("Error GET Public Programs:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data program" },
      { status: 500 }
    );
  }
}
