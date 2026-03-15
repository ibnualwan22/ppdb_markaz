import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkPermission } from "@/lib/checkPermission";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const auth = await checkPermission(req, "manage_users");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      include: {
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Sembunyikan field password dari response API
    const safeUsers = users.map(u => ({
      id: u.id,
      nama: u.nama,
      username: u.username,
      roleId: u.role.id,
      roleName: u.role.nama,
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkPermission(req, "manage_users");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const body = await req.json();
    const { nama, username, password, roleId } = body;

    if (!nama || !username || !password || !roleId) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    const exist = await prisma.user.findUnique({ where: { username } });
    if (exist) return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nama,
        username,
        password: hashedPassword,
        roleId
      }
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Error creating user", error);
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await checkPermission(req, "manage_users");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const body = await req.json();
    const { id, nama, username, password, roleId } = body;

    if (!id || !nama || !username || !roleId) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const existUser = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!existUser) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    if (existUser.role.nama === "Super Admin" && auth.role !== "Super Admin") {
      return NextResponse.json({ error: "Hanya Super Admin yang bisa mengedit akun ini" }, { status: 403 });
    }

    let updateData: any = { nama, username, roleId };

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    const { password: _, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error("Error updating user", error);
    return NextResponse.json({ error: "Gagal memperbarui akun" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await checkPermission(req, "manage_users");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });

    const existUser = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!existUser) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    if (existUser.role.nama === "Super Admin") return NextResponse.json({ error: "Tidak dapat menghapus akun berstatus Super Admin" }, { status: 403 });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Akun berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting user", error);
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
