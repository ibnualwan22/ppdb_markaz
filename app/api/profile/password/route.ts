import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { passwordLama, passwordBaru } = body;

    if (!passwordLama || !passwordBaru || passwordBaru.length < 5) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(passwordLama, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password lama tidak sesuai" }, { status: 400 });
    }

    // Set password baru
    const hashedPassword = await bcrypt.hash(passwordBaru, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: "Password berhasil diganti" });

  } catch (error) {
    console.error("Error changing password", error);
    return NextResponse.json({ error: "Gagal mengganti password" }, { status: 500 });
  }
}
