/** Respuestas que no deben cachearse (Vercel / CDN / proxy). */
export const CACHE_HEADERS_NO_STORE: HeadersInit = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
};
