"use client";

import Image from "next/image";

type MercadoPagoButtonProps = {
  onClick?: () => void;
  href?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export function MercadoPagoButton({
  onClick,
  href,
  label = "Pagar con Mercado Pago",
  className = "",
  disabled = false,
  type = "button",
}: MercadoPagoButtonProps) {
  const content = (
    <>
      <Image
        src="/Mercado_Pago_logo.svg"
        alt=""
        aria-hidden
        width={22}
        height={22}
      />
      <span>{label}</span>
    </>
  );

  const styles =
    "inline-flex items-center gap-2 rounded-full bg-[#009EE3] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#008fce] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

  if (href) {
    return (
      <a
        href={href}
        className={`${styles} ${className}`}
        aria-disabled={disabled}
        onClick={
          disabled
            ? (e) => {
                e.preventDefault();
              }
            : undefined
        }
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles} ${className}`}
    >
      {content}
    </button>
  );
}
