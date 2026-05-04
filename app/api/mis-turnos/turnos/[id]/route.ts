import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { canonicalPhoneDigitsAR } from "../../../../../lib/customer/phone-canonical-ar";
import {
  readCustomerSessionPhoneDigits,
  WANDA_CUSTOMER_SESSION_COOKIE,
} from "../../../../../lib/customer/customer-session";
import { getDb } from "../../../../../lib/mongodb";
import {
  cancelTurnoByCustomer,
  findCustomerTurnoById,
  reprogramIndividualTurnoByCustomer,
  serializeTurnoForCustomer,
} from "../../../../../lib/turnos/customer-turnos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sessionDigitsOr401(): Promise<string | NextResponse> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WANDA_CUSTOMER_SESSION_COOKIE)?.value;
  const fromCookie = readCustomerSessionPhoneDigits(raw);
  if (!fromCookie) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });
  const digits = canonicalPhoneDigitsAR(fromCookie);
  if (!digits) return NextResponse.json({ error: "No iniciaste sesión." }, { status: 401 });
  return digits;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const digitsResult = await sessionDigitsOr401();
  if (digitsResult instanceof NextResponse) return digitsResult;
  const digits = digitsResult;

  try {
    const db = await getDb();
    const row = await findCustomerTurnoById(db, id.trim(), digits);
    if (!row) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    const base = serializeTurnoForCustomer(row);
    return NextResponse.json({
      ...base,
      horario: String(row.horario ?? ""),
    });
  } catch (e) {
    console.error("[mis-turnos/turnos/[id] GET]", e);
    return NextResponse.json({ error: "No se pudo cargar el turno." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const digitsResult = await sessionDigitsOr401();
  if (digitsResult instanceof NextResponse) return digitsResult;
  const digits = digitsResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const dateKey =
    typeof body === "object" && body && "dateKey" in body ? String((body as { dateKey: unknown }).dateKey ?? "").trim() : "";
  const timeLocal =
    typeof body === "object" && body && "timeLocal" in body
      ? String((body as { timeLocal: unknown }).timeLocal ?? "").trim()
      : "";

  try {
    const db = await getDb();
    const result = await reprogramIndividualTurnoByCustomer(db, id.trim(), digits, dateKey, timeLocal);
    if (!result.ok) {
      const code = result.code;
      const status =
        code === "NOT_FOUND" || code === "FORBIDDEN"
          ? 404
          : code === "SLOT_UNAVAILABLE" || code === "SLOT_TAKEN" || code === "CONFLICT" || code === "TEMPLATE_MISMATCH"
            ? 409
            : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[mis-turnos/turnos/[id] PATCH]", e);
    return NextResponse.json({ error: "No se pudo actualizar el turno." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const digitsResult = await sessionDigitsOr401();
  if (digitsResult instanceof NextResponse) return digitsResult;
  const digits = digitsResult;

  try {
    const db = await getDb();
    const result = await cancelTurnoByCustomer(db, id.trim(), digits);
    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND" ? 404 : result.code === "CONFLICT" || result.code === "NOT_CANCELLABLE" ? 409 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[mis-turnos/turnos/[id] DELETE]", e);
    return NextResponse.json({ error: "No se pudo cancelar el turno." }, { status: 500 });
  }
}
