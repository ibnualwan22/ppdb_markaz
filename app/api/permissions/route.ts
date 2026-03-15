import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { namaAksi: 'asc' }
    });
    return NextResponse.json(permissions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
