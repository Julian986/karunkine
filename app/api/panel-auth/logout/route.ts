import { NextResponse } from "next/server";

const PANEL_SESSION_COOKIE = "panel_turnos_session";

export async function POST() {
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: "/panel-turnos/login",
    },
  });
  response.cookies.set({
    name: PANEL_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return response;
}
