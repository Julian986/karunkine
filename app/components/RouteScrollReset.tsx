"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

import { scrollWindowToTop } from "../../lib/scroll-route";

/**
 * Al cambiar de ruta (ej. home → taller), Next y el navegador pueden conservar el scroll.
 * Restablece arriba del todo de forma instantánea, salvo si la URL trae hash (/#sección).
 */
export default function RouteScrollReset() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (prevPathname.current === null) {
      prevPathname.current = pathname;
      return;
    }
    if (prevPathname.current === pathname) return;

    prevPathname.current = pathname;
    if (typeof window === "undefined" || window.location.hash) return;

    scrollWindowToTop();
    const raf1 = requestAnimationFrame(() => {
      scrollWindowToTop();
      requestAnimationFrame(scrollWindowToTop);
    });
    const t0 = window.setTimeout(scrollWindowToTop, 0);
    const t1 = window.setTimeout(scrollWindowToTop, 50);
    const t2 = window.setTimeout(scrollWindowToTop, 150);

    return () => {
      cancelAnimationFrame(raf1);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}
