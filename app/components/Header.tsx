"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { event as gaEvent } from "../../lib/gtag";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#formulario-reserva", label: "Agendar" },
  { href: "#sobre-nosotros", label: "Nosotros" },
  { href: "#tratamiento", label: "Tratamiento" },
  { href: "#consulta-inicial", label: "Evaluación" },
  { href: "#preguntas-frecuentes", label: "Preguntas" },
  { href: "#contacto", label: "Contacto" },
];

function useScrollLock(locked: boolean, scrollYRef: React.MutableRefObject<number>) {
  useEffect(() => {
    if (!locked) return;
    const scrollY = window.scrollY;
    scrollYRef.current = scrollY;
    const style = document.body.style;
    const htmlStyle = document.documentElement.style;
    const prevScrollBehavior = htmlStyle.scrollBehavior;

    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    htmlStyle.overflow = "hidden";
    return () => {
      style.overflow = "";
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      htmlStyle.overflow = "";
      // Evita animación involuntaria por `scroll-behavior: smooth` global.
      htmlStyle.scrollBehavior = "auto";
      window.scrollTo(0, scrollYRef.current);
      window.requestAnimationFrame(() => {
        htmlStyle.scrollBehavior = prevScrollBehavior;
      });
    };
  }, [locked, scrollYRef]);
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollYRef = useRef(0);
  const closeTimeoutRef = useRef<number | null>(null);
  const openRafRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);
  useScrollLock(menuVisible, scrollYRef);

  useEffect(() => {
    return () => {
      if (openRafRef.current) {
        window.cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (menuOpen) {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setMenuVisible(true);
      return;
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setMenuVisible(false);
      closeTimeoutRef.current = null;
    }, 280);
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [menuOpen]);

  const openMenu = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMenuVisible(true);
    if (openRafRef.current) {
      window.cancelAnimationFrame(openRafRef.current);
    }
    openRafRef.current = window.requestAnimationFrame(() => {
      setMenuOpen(true);
      openRafRef.current = null;
    });
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const trackMisTurnosClick = (location: "header_desktop" | "header_mobile") => {
    gaEvent("mis_turnos_click", {
      location,
    });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    closeMenu();
    window.setTimeout(() => {
      const target = document.querySelector(href);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", href);
      }
    }, 320);
  };

  if (pathname?.startsWith("/panel-turnos") || pathname?.startsWith("/mis-turnos")) {
    return null;
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/15 bg-[#963417]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 md:px-8">
        <a href="#inicio" className="text-lg font-semibold text-white">
          Karunkine
        </a>

        {/* Desktop nav — Mis turnos primero y destacado */}
        <nav className="hidden md:flex md:items-center md:gap-5">
          <Link
            href="/mis-turnos"
            prefetch
            onClick={() => trackMisTurnosClick("header_desktop")}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#963417] shadow-[0_4px_16px_rgba(0,0,0,0.18)] ring-2 ring-white/90 transition hover:bg-amber-50 hover:brightness-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Mis turnos
          </Link>
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href + label}
              href={href}
              className="text-base font-medium text-white/90 transition hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu: portal a body solo después de hidratar para evitar mismatch */}
      {mounted &&
        menuVisible &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] md:hidden"
            aria-hidden={!menuOpen}
            style={{ pointerEvents: menuOpen ? "auto" : "none" }}
          >
            <div
              className="absolute inset-0 bg-black/60 transition-opacity duration-300"
              style={{ opacity: menuOpen ? 1 : 0 }}
              onClick={closeMenu}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-white shadow-xl transition-transform duration-300 ease-out"
              style={{ transform: menuOpen ? "translateX(0)" : "translateX(100%)" }}
            >
              <div className="flex items-center justify-end border-b border-zinc-100 px-4 py-3">
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col pb-8 pt-4">
                <Link
                  href="/mis-turnos"
                  prefetch
                  onClick={() => {
                    trackMisTurnosClick("header_mobile");
                    closeMenu();
                  }}
                  className="mx-4 mb-3 flex items-center justify-center gap-2 rounded-2xl bg-[#963417] px-5 py-4 text-center text-base font-bold text-white shadow-[0_8px_24px_rgba(150,52,23,0.45)] ring-2 ring-[#963417]/30 transition hover:bg-[#a8431c] hover:shadow-lg active:scale-[0.99]"
                >
                  <svg className="h-5 w-5 shrink-0 opacity-95" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
                    />
                  </svg>
                  Mis turnos
                </Link>
                {NAV_LINKS.map(({ href, label }) => (
                  <a
                    key={href + label}
                    href={href}
                    onClick={(e) => handleNavClick(e, href)}
                    className="border-b border-zinc-100 px-6 py-4 text-base font-medium text-zinc-800 transition hover:bg-zinc-50 hover:text-[#d4602c]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
