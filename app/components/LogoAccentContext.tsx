"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Logo 01 activo */
export const ACCENT_LOGO_V1 = "#a56a42";
/** Logo 02 activo */
export const ACCENT_LOGO_V2 = "#843921";

/** Convierte #RRGGBB a rgba para anillos/bordes con opacidad */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6 || Number.isNaN(parseInt(clean, 16))) {
    return `rgba(165, 106, 66, ${alpha})`;
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type LogoAccentContextValue = {
  /** true = logo 02 (VER 02), false = logo 01 (VER 01) */
  isLogoV2: boolean;
  accentColor: string;
  toggleLogo: () => void;
};

const LogoAccentContext = createContext<LogoAccentContextValue | null>(null);

export function LogoAccentProvider({ children }: { children: ReactNode }) {
  const [isLogoV2, setIsLogoV2] = useState(false);

  const toggleLogo = useCallback(() => {
    setIsLogoV2((v) => !v);
  }, []);

  const value = useMemo(
    () => ({
      isLogoV2,
      accentColor: isLogoV2 ? ACCENT_LOGO_V2 : ACCENT_LOGO_V1,
      toggleLogo,
    }),
    [isLogoV2, toggleLogo]
  );

  return (
    <LogoAccentContext.Provider value={value}>
      {children}
    </LogoAccentContext.Provider>
  );
}

export function useLogoAccent() {
  const ctx = useContext(LogoAccentContext);
  if (!ctx) {
    throw new Error("useLogoAccent debe usarse dentro de LogoAccentProvider");
  }
  return ctx;
}
