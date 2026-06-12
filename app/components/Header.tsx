"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { event as gaEvent } from "../../lib/gtag";
import { clearBodyScrollLock, scrollWindowToTop } from "../../lib/scroll-route";
import { getActiveTallerEvento } from "../../lib/taller/get-evento";
import { HeaderMobileMenu, type MobileNavItem } from "./HeaderMobileMenu";

const BASE_NAV_LINKS: readonly MobileNavItem[] = [
  { href: "#inicio", label: "Inicio", icon: "home" },
  { href: "#formulario-reserva", label: "Agendar", icon: "calendar" },
  { href: "#sobre-nosotros", label: "Nosotros", icon: "users" },
  { href: "#tratamiento", label: "Tratamiento", icon: "heart" },
  { href: "#consulta-inicial", label: "Evaluación", icon: "clipboard" },
  { href: "#preguntas-frecuentes", label: "Preguntas", icon: "help-circle" },
  { href: "#contacto", label: "Contacto", icon: "mail" },
];

function buildNavLinks(): MobileNavItem[] {
  const taller = getActiveTallerEvento();
  if (!taller) return [...BASE_NAV_LINKS];
  return [
    BASE_NAV_LINKS[0],
    BASE_NAV_LINKS[1],
    {
      href: `/${taller.slug}`,
      label: "Inscribirse al taller",
      icon: "user-plus",
    },
    ...BASE_NAV_LINKS.slice(2),
  ];
}

/** En subpáginas, las anclas de la home van como /#sección para que el navegador redirija bien. */
function resolveNavHref(href: string, pathname: string | null): string {
  if (!href.startsWith("#")) return href;
  if (pathname === "/") return href;
  return `/${href}`;
}

function useScrollLock(
  locked: boolean,
  scrollYRef: React.MutableRefObject<number>,
  restoreScrollOnUnlockRef: React.MutableRefObject<boolean>,
) {
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
    style.width = "100%";
    htmlStyle.overflow = "hidden";
    return () => {
      clearBodyScrollLock();
      htmlStyle.scrollBehavior = "auto";
      if (restoreScrollOnUnlockRef.current) {
        window.scrollTo(0, scrollYRef.current);
      } else {
        window.scrollTo(0, 0);
      }
      restoreScrollOnUnlockRef.current = true;
      window.requestAnimationFrame(() => {
        htmlStyle.scrollBehavior = prevScrollBehavior;
      });
    };
  }, [locked, scrollYRef, restoreScrollOnUnlockRef]);
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollYRef = useRef(0);
  const restoreScrollOnUnlockRef = useRef(true);
  const prevPathnameRef = useRef<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const openRafRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    restoreScrollOnUnlockRef.current = false;
    setMenuOpen(false);
    setMenuVisible(false);
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!window.location.hash) {
      scrollWindowToTop();
    }
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1031px)");
    const onChange = () => {
      if (mq.matches) closeMenu();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useScrollLock(menuVisible, scrollYRef, restoreScrollOnUnlockRef);

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

  const closeMenuForNavigation = () => {
    restoreScrollOnUnlockRef.current = false;
    setMenuOpen(false);
    setMenuVisible(false);
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    clearBodyScrollLock();
  };

  const trackMisTurnosClick = (location: "header_desktop" | "header_mobile") => {
    gaEvent("mis_turnos_click", {
      location,
    });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    if (pathname !== "/") return;
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

  const isHome = pathname === "/";
  const navLinks = buildNavLinks();

  if (pathname?.startsWith("/panel-turnos") || pathname?.startsWith("/mis-turnos")) {
    return null;
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/15 bg-[#963417]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 nav:px-8">
        <Link href="/" className="text-lg font-semibold text-white">
          Karunkine
        </Link>

        {/* Desktop nav — Mi perfil primero y destacado */}
        <nav className="hidden nav:flex nav:items-center nav:gap-5">
          <Link
            href="/mis-turnos"
            prefetch
            onClick={() => trackMisTurnosClick("header_desktop")}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#963417] shadow-[0_4px_16px_rgba(0,0,0,0.18)] ring-2 ring-white/90 transition hover:bg-amber-50 hover:brightness-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Mi perfil
          </Link>
          {navLinks.map(({ href, label }) =>
            href.startsWith("#") ? (
              <a
                key={href + label}
                href={resolveNavHref(href, pathname)}
                className="text-base font-medium text-white/90 transition hover:text-white"
              >
                {label}
              </a>
            ) : (
              <Link
                key={href + label}
                href={href}
                prefetch
                className="text-base font-medium text-white/90 transition hover:text-white"
              >
                {label}
              </Link>
            ),
          )}
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 nav:hidden"
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
            className="fixed inset-0 z-[9999] nav:hidden"
            aria-hidden={!menuOpen}
            style={{ pointerEvents: menuOpen ? "auto" : "none" }}
          >
            <HeaderMobileMenu
              open={menuOpen}
              onClose={closeMenu}
              onNavigate={closeMenuForNavigation}
              pathname={pathname}
              isHome={isHome}
              navLinks={navLinks}
              resolveNavHref={resolveNavHref}
              onHashNavClick={handleNavClick}
              onMisTurnosClick={() => trackMisTurnosClick("header_mobile")}
            />
          </div>,
          document.body
        )}
    </header>
  );
}
