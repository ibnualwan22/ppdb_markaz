import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const modul = searchParams.get("modul") || "";
    const aksi = searchParams.get("aksi") || "";
    const user = searchParams.get("user") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // 1. Auto-cleanup: Hapus log yang sudah > 30 hari
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });

    // 2. Build WHERE filter
    const where: any = {};

    if (modul) {
      where.modul = modul;
    }
    if (aksi) {
      where.aksi = aksi;
    }
    if (user) {
      where.namaUser = { contains: user, mode: "insensitive" };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        // dateFrom comes as "YYYY-MM-DD", treat as start of day WIB (UTC+7)
        where.createdAt.gte = new Date(`${dateFrom}T00:00:00+07:00`);
      }
      if (dateTo) {
        // dateTo comes as "YYYY-MM-DD", treat as end of day WIB (UTC+7)
        where.createdAt.lte = new Date(`${dateTo}T23:59:59+07:00`);
      }
    }

    // 3. Total count for pagination
    const total = await prisma.activityLog.count({ where });

    // 4. Fetch data with pagination
    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 5. Get unique users for filter dropdown
    const uniqueUsers = await prisma.activityLog.findMany({
      distinct: ["namaUser"],
      select: { namaUser: true },
      orderBy: { namaUser: "asc" }
    });

    // 6. Get unique modules for filter dropdown
    const uniqueModules = await prisma.activityLog.findMany({
      distinct: ["modul"],
      select: { modul: true },
      orderBy: { modul: "asc" }
    });

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        users: uniqueUsers.map((u: { namaUser: string }) => u.namaUser),
        modules: uniqueModules.map((m: { modul: string }) => m.modul),
      }
    });
  } catch (error) {
    console.error("Error GET /api/activity-log:", error);
    return NextResponse.json({ error: "Gagal memuat log aktivitas" }, { status: 500 });
  }
}
