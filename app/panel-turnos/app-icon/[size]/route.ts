import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ALLOWED_SIZES = new Set(["192", "512"]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size } = await context.params;
  if (!ALLOWED_SIZES.has(size)) {
    return NextResponse.json({ error: "Tamaño no soportado." }, { status: 404 });
  }

  const iconPath = path.join(process.cwd(), "public", "icon.png");

  try {
    const iconBuffer = await readFile(iconPath);
    return new NextResponse(new Uint8Array(iconBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se encontró public/icon.png." },
      { status: 404 }
    );
  }
}
