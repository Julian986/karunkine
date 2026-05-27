import type { Metadata } from "next";
import CheckoutStatus from "../../components/CheckoutStatus";

type PageProps = {
  searchParams?: Promise<{ estado?: string }>;
};

export const metadata: Metadata = {
  title: "Estado de reserva",
  description: "Estado de pago y confirmación de la reserva.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReservaResultadoPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  return <CheckoutStatus estado={params.estado} />;
}
