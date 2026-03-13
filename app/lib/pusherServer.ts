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
