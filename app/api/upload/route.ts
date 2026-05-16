import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File wajib dikirim" }, { status: 400 });
    }

    // Validasi tipe file
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Hanya file PNG, JPG, atau WebP yang diperbolehkan" }, { status: 400 });
    }

    // Validasi ukuran (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Konfigurasi Cloudinary belum lengkap" }, { status: 500 });
    }

    // Generate signature untuk signed upload
    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = "pengajar";
    
    // String to sign harus alphabetical order
    const signString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signString).digest("hex");

    // Upload ke Cloudinary via API
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadForm,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cloudinary error:", data);
      return NextResponse.json({ error: data.error?.message || "Gagal upload ke Cloudinary" }, { status: 500 });
    }

    return NextResponse.json({
      url: data.secure_url,
      publicId: data.public_id,
    });
  } catch (error: any) {
    console.error("Error Upload:", error);
    return NextResponse.json({ error: "Gagal memproses upload" }, { status: 500 });
  }
}
