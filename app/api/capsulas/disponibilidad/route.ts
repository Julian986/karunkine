import { NextResponse } from "next/server";

import { getDefaultActiveCapsulasCiclo } from "../../../../lib/capsulas/config";
import { listCapsulasDisponiblesPublicas } from "../../../../lib/capsulas/disponibilidad";
import { CACHE_HEADERS_NO_STORE } from "../../../../lib/http/cache-control";
import { getDb } from "../../../../lib/mongodb";
import { ensureCapsulasInscripcionIndexes } from "../../../../lib/mongodb/ensure-capsulas-indexes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ciclo = getDefaultActiveCapsulasCiclo();
  if (!ciclo) {
    return NextResponse.json({ ciclo: null, items: [] }, { headers: CACHE_HEADERS_NO_STORE });
  }

  try {
    const db = await getDb();
    await ensureCapsulasInscripcionIndexes(db);
    const items = await listCapsulasDisponiblesPublicas(db, ciclo);
    return NextResponse.json(
      {
        ciclo: {
          slug: ciclo.slug,
          titulo: ciclo.titulo,
          mesLabel: ciclo.mesLabel,
          precioArs: ciclo.precioArs,
          cupo: ciclo.cupo,
          horario: ciclo.horario,
          lugar: ciclo.lugar,
        },
        items,
      },
      { headers: CACHE_HEADERS_NO_STORE },
    );
  } catch (e) {
    console.error("[capsulas/disponibilidad]", e);
    return NextResponse.json(
      { error: "No se pudieron cargar las cápsulas." },
      { status: 500, headers: CACHE_HEADERS_NO_STORE },
    );
  }
}
