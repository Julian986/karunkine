import CheckoutStatus from "../../components/CheckoutStatus";

type PageProps = {
  searchParams?: Promise<{ estado?: string }>;
};

export default async function ReservaResultadoPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  return <CheckoutStatus estado={params.estado} />;
}
