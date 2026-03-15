import { NextRequest, NextResponse } from "next/server"
import { checkPermission } from "@/lib/checkPermission"

// Contoh Endpoint untuk DELETE Sakan
export async function DELETE(req: NextRequest) {
  // Hanya user atau API yang memiliki "delete_data" atau "all_access" permission yang bisa hapus
  const auth = await checkPermission(req, "delete_data")

  if (!auth.allowed) {
    return NextResponse.json({ error: auth.reason }, { status: 403 })
  }

  // Jika LOLOS (Authorized), jalankan logika penghapusan
  try {
    // const sakanId = ... 
    // await prisma.sakan.delete({ ... })
    
    return NextResponse.json({ 
      success: true, 
      message: "Data Sakan berhasil dihapus.",
      authInfo: {
        type: auth.type,
        role: auth.role
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 })
  }
}
