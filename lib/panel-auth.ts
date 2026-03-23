import { cookies } from "next/headers";

export const PANEL_SESSION_COOKIE = "panel_turnos_session";

export async function isPanelAuthenticated() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(PANEL_SESSION_COOKIE)?.value;
  const expected = process.env.PANEL_TURNOS_SESSION_TOKEN;
  if (!expected) return false;
  return sessionValue === expected;
}
