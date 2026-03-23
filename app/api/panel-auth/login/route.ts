import { NextResponse } from "next/server";

const PANEL_SESSION_COOKIE = "panel_turnos_session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const redirectToRaw = String(formData.get("redirectTo") ?? "/panel-turnos");

  const panelPassword = process.env.PANEL_TURNOS_PASSWORD;
  const sessionToken = process.env.PANEL_TURNOS_SESSION_TOKEN;

  if (!panelPassword || !sessionToken) {
    return NextResponse.json(
      {
        error:
          "Faltan variables de entorno PANEL_TURNOS_PASSWORD y/o PANEL_TURNOS_SESSION_TOKEN.",
      },
      { status: 500 }
    );
  }

  if (password !== panelPassword) {
    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: "/panel-turnos/login?error=invalid",
      },
    });
  }

  const redirectTo = redirectToRaw.startsWith("/panel-turnos")
    ? redirectToRaw
    : "/panel-turnos";

  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: redirectTo,
    },
  });
  response.cookies.set({
    name: PANEL_SESSION_COOKIE,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
