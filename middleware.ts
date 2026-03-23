import { NextResponse, type NextRequest } from "next/server";

const PANEL_SESSION_COOKIE = "panel_turnos_session";

function hasValidPanelSession(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(PANEL_SESSION_COOKIE)?.value;
  const expectedValue = process.env.PANEL_TURNOS_SESSION_TOKEN;
  if (!expectedValue) return false;
  return cookieValue === expectedValue;
}

function buildAbsoluteUrl(
  request: NextRequest,
  pathname: string,
  searchParams?: Record<string, string>
): URL {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin =
    forwardedProto && forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : request.nextUrl.origin;

  const url = new URL(pathname, origin);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/panel-turnos")) {
    return NextResponse.next();
  }

  const isLoginPath = pathname === "/panel-turnos/login";
  const isPanelPwaIconPath = pathname.startsWith("/panel-turnos/app-icon/");

  if (isPanelPwaIconPath) {
    return NextResponse.next();
  }

  const isAuthenticated = hasValidPanelSession(request);

  if (isLoginPath && isAuthenticated) {
    return NextResponse.redirect(buildAbsoluteUrl(request, "/panel-turnos"));
  }

  if (!isLoginPath && !isAuthenticated) {
    return NextResponse.redirect(
      buildAbsoluteUrl(request, "/panel-turnos/login", { error: "auth" })
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel-turnos/:path*"],
};
