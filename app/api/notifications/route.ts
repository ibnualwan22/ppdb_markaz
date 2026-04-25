import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const permissionsStr = searchParams.get("permissions") || "";
    const permissions = permissionsStr.split(",").filter(Boolean);

    // 1. Bersihkan Notifikasi Lama (> 30 Hari)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // 2. Ambil Notifikasi berdasarkan permission
    if (permissions.length === 0) {
      return NextResponse.json([]);
    }

    const hasAllAccess = permissions.includes("all_access");

    const notifications = await prisma.notification.findMany({
      where: hasAllAccess ? undefined : {
        permissionRequired: {
          in: permissions
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Batasi 50 terbaru untuk performa
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Gagal mengambil notifikasi" }, { status: 500 });
  }
}
