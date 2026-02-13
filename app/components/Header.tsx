"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const NAV_LINKS = [
  { href: "#", label: "Inicio" },
  { href: "#formulario-reserva", label: "Reservar" },
  { href: "#tratamiento", label: "Tratamiento" },
  { href: "#actividades", label: "Actividades" },
  { href: "#preguntas-frecuentes", label: "Preguntas" },
  { href: "#contacto", label: "Contacto" },
];

function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const scrollY = window.scrollY;
    const style = document.body.style;
    const htmlStyle = document.documentElement.style;
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
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useScrollLock(menuOpen);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 md:px-8">
        <a href="#" className="text-lg font-semibold text-white" onClick={handleNavClick}>
          Karunkine
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-6">
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
          onClick={() => setMenuOpen((o) => !o)}
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
        createPortal(
          <div
            className="fixed inset-0 z-[9999] md:hidden"
            aria-hidden={!menuOpen}
            style={{
              pointerEvents: menuOpen ? "auto" : "none",
              visibility: menuOpen ? "visible" : "hidden",
            }}
          >
            <div
              className="absolute inset-0 bg-black/60 transition-opacity duration-200"
              style={{ opacity: menuOpen ? 1 : 0 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-white shadow-xl transition-transform duration-200 ease-out"
              style={{ transform: menuOpen ? "translateX(0)" : "translateX(100%)" }}
            >
              <div className="flex items-center justify-end border-b border-zinc-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Cerrar menú"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col pb-8 pt-4">
                {NAV_LINKS.map(({ href, label }) => (
                  <a
                    key={href + label}
                    href={href}
                    onClick={handleNavClick}
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
