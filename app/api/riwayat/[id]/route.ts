import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lemariIdBaru } = body;

    if (!lemariIdBaru) return NextResponse.json({ error: "Lemari tujuan kosong" }, { status: 400 });

    const update = await prisma.riwayatDufah.update({
      where: { id },
      data: { lemariId: lemariIdBaru, status: "ASSIGNED" }
    });

    return NextResponse.json({ message: "Santri berhasil dipindahkan!", data: update });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memindahkan santri" }, { status: 500 });
  }
}