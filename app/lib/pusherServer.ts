import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export const emitDataUpdate = async (tag: string) => {
  try {
    await pusherServer.trigger("ppdb-channel", "data:update", { tag });
  } catch (error) {
    console.error("Pusher data:update error:", error);
  }
};

export const emitNotification = async (tipe: "asrama" | "idcard", message: string, data: any) => {
  try {
    await pusherServer.trigger("ppdb-channel", `notif:${tipe}`, { message, data });
  } catch (error) {
    console.error("Pusher emitNotification error:", error);
  }
};

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const sendGlobalNotification = async (
  title: string, 
  message: string, 
  permissionRequired: string, 
  link: string | null = null
) => {
  try {
    // 1. Simpan ke database
    const notif = await prisma.notification.create({
      data: {
        title,
        message,
        permissionRequired,
        link
      }
    });

    // 2. Broadcast via Pusher
    await pusherServer.trigger("channel-markaz", "new-notif", notif);
    
    return notif;
  } catch (error) {
    console.error("Failed to send global notification:", error);
  }
};

// ── Activity Log (Audit Trail) ─────────────────────────────
export const logActivity = async (params: {
  aksi: "CREATE" | "UPDATE" | "DELETE" | "VERIFY";
  modul: string;
  deskripsi: string;
  userId?: string | null;
  namaUser?: string;
  targetId?: string | null;
  metadata?: any;
}) => {
  try {
    await prisma.activityLog.create({
      data: {
        aksi: params.aksi,
        modul: params.modul,
        deskripsi: params.deskripsi,
        userId: params.userId || null,
        namaUser: params.namaUser || "Sistem",
        targetId: params.targetId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

