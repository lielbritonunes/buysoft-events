import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Supported video MIME types
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-matroska",
];

// Max file size: 250MB
const MAX_FILE_SIZE = 250 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de vídeo enviado" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "O arquivo excede o limite máximo permitido de 250MB" },
        { status: 400 }
      );
    }

    // Check MIME type or file extension
    const originalExt = path.extname(file.name || "").toLowerCase() || ".mp4";
    const isAllowedType =
      ALLOWED_VIDEO_TYPES.includes(file.type) ||
      [".mp4", ".webm", ".mov", ".mkv", ".ogg"].includes(originalExt);

    if (!isAllowedType) {
      return NextResponse.json(
        { error: "Formato de vídeo inválido. Utilize MP4, WebM ou MOV." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/videoclips directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "videoclips");
    await mkdir(uploadsDir, { recursive: true });

    const safeBaseName = path
      .basename(file.name, originalExt)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 30);

    const filename = `clip_${Date.now()}_${safeBaseName}${originalExt}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/videoclips/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Erro ao salvar videoclipe:", error);
    return NextResponse.json(
      { error: "Falha ao salvar o arquivo de vídeo no servidor." },
      { status: 500 }
    );
  }
}
