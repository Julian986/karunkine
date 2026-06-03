"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Al cambiar de ruta (ej. home → taller), Next puede conservar el scroll.
 * Restablece arriba del todo de forma instantánea, salvo si la URL trae hash (/#sección).
 */
export default function RouteScrollReset() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (prevPathname.current === null) {
      prevPathname.current = pathname;
      return;
    }
    if (prevPathname.current === pathname) return;

    prevPathname.current = pathname;
    if (typeof window === "undefined" || window.location.hash) return;

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => {
      html.style.scrollBehavior = prevBehavior;
    });
  }, [pathname]);

  return null;
}
