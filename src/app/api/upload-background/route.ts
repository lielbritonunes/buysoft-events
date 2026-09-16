import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Formato de arquivo inválido. Selecione uma imagem (PNG, JPG, WebP)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/backgrounds directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "backgrounds");
    await mkdir(uploadsDir, { recursive: true });

    // Derive file extension or default to .jpg
    const originalExt = path.extname(file.name || "") || ".jpg";
    const filename = `bg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${originalExt}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/backgrounds/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Erro ao salvar imagem de plano de fundo:", error);
    return NextResponse.json(
      { error: "Falha ao salvar a imagem do plano de fundo" },
      { status: 500 }
    );
  }
}
