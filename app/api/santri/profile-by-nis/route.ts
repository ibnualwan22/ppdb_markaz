import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "SANTRI") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nis = searchParams.get('nis');

    if (!nis || session.user.username !== nis) {
      return NextResponse.json({ success: false, error: "NIS tidak valid" }, { status: 400 });
    }

    const santri = await prisma.santri.findUnique({
      where: { nis }
    });

    if (!santri) {
      return NextResponse.json({ success: false, error: "Santri tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: santri });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
