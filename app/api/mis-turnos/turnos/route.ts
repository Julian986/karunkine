import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { canonicalPhoneDigitsAR } from "../../../../lib/customer/phone-canonical-ar";
import {
  readCustomerSessionPhoneDigits,
  WANDA_CUSTOMER_SESSION_COOKIE,
} from "../../../../lib/customer/customer-session";
import { getDb } from "../../../../lib/mongodb";
import { listCustomerTurnos, serializeTurnoForCustomer } from "../../../../lib/turnos/customer-turnos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WANDA_CUSTOMER_SESSION_COOKIE)?.value;
  const fromCookie = readCustomerSessionPhoneDigits(raw);
  if (!fromCookie) {
    return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });
  }
  const digits = canonicalPhoneDigitsAR(fromCookie);
  if (!digits) {
    return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });
  }

  try {
    const db = await getDb();
    const rows = await listCustomerTurnos(db, digits);
    return NextResponse.json({
      turnos: rows.map(serializeTurnoForCustomer),
    });
  } catch (e) {
    console.error("[mis-turnos/turnos]", e);
    return NextResponse.json({ error: "No se pudieron cargar los turnos." }, { status: 500 });
  }
}
