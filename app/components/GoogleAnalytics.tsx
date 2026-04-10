"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID, pageview } from "../../lib/gtag";

function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstPath = useRef(true);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== "production") return;

    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;

    // El `gtag('config', id)` inicial ya envía el primer page_view; solo trackeamos navegaciones SPA.
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Carga gtag.js y envía pageviews en cada cambio de ruta (App Router).
 */
export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          var dataLayer = window.dataLayer;
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
