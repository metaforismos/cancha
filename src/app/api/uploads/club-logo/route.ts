import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa PNG, JPEG o WebP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "El archivo es muy grande. Máximo 2MB." },
      { status: 400 }
    );
  }

  // Convert to base64 data URL and store in DB directly
  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return NextResponse.json({ url: dataUrl }, { status: 201 });
}
