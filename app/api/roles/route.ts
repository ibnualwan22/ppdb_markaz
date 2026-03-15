import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkPermission } from "@/lib/checkPermission";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const auth = await checkPermission(req, "manage_roles");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRoles = roles.map(role => ({
      id: role.id,
      nama: role.nama,
      usersCount: role._count.users,
      permissions: role.permissions.map(p => p.permission.namaAksi)
    }));

    return NextResponse.json(formattedRoles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkPermission(req, "manage_roles");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const body = await req.json();
    const { nama, permissionIds } = body;

    // Pastikan payload memiliki required field
    if (!nama || !permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        nama,
        permissions: {
          create: permissionIds.map(id => ({
            permissionId: id
          }))
        }
      }
    });

    return NextResponse.json({ success: true, data: newRole });
  } catch (error) {
    console.error("Error creating role", error);
    return NextResponse.json({ error: "Gagal membuat role" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await checkPermission(req, "manage_roles");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const body = await req.json();
    const { id, nama, permissionIds } = body;

    if (!id || !nama || !permissionIds || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    // Hindari ubah Super Admin jika hardcoded requirement
    if (nama === "Super Admin") {
      // Boleh opsional untuk memprotect Role 'Super Admin'
    }

    // Pertama hapus semua relasi permissions lama
    await prisma.rolePermission.deleteMany({
      where: { roleId: id }
    });

    // Kemudian update data dengan permissions baru
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        nama,
        permissions: {
          create: permissionIds.map(permId => ({
            permissionId: permId
          }))
        }
      }
    });

    return NextResponse.json({ success: true, data: updatedRole });
  } catch (error) {
    console.error("Error updating role", error);
    return NextResponse.json({ error: "Gagal memperbarui role" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await checkPermission(req, "manage_roles");
  if (!auth.allowed) return NextResponse.json({ error: auth.reason }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID dibutuhkan" }, { status: 400 });

    const role = await prisma.role.findUnique({ where: { id }, include: { users: true } });
    if (!role) return NextResponse.json({ error: "Role tidak ditemukan" }, { status: 404 });
    if (role.nama === "Super Admin") return NextResponse.json({ error: "Tidak dapat menghapus Super Admin" }, { status: 400 });
    if (role.users.length > 0) return NextResponse.json({ error: "Tidak dapat menghapus role yang masih digunakan user" }, { status: 400 });

    await prisma.role.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Role berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting role", error);
    return NextResponse.json({ error: "Gagal menghapus role" }, { status: 500 });
  }
}
