import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de turnos | Acceso",
};

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function PanelTurnosLoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const hasInvalidError = params.error === "invalid";

  return (
    <main className="panel-v2-theme min-h-screen bg-[#F0F1F3] px-4 pb-12 pt-16">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] sm:p-8">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-gray-500">Panel</p>
          <h1 className="mt-1 text-[24px] font-bold text-gray-900">Karün · Wanda</h1>
          <p className="mt-2 text-sm text-gray-500">Ingresá tu clave para ver y gestionar los turnos.</p>

          <form action="/api/panel-auth/login" method="post" className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value="/panel-turnos" />
            <div>
              <label htmlFor="panel-password" className="mb-1 block text-sm font-medium text-gray-700">
                Clave
              </label>
              <input
                id="panel-password"
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-[#B88E2F]/50"
                placeholder="Ingresá la clave"
              />
            </div>

            {hasInvalidError ? (
              <p className="text-sm font-medium text-red-600" role="alert">
                Clave incorrecta. Intentá nuevamente.
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#B88E2F] px-4 py-3 font-semibold text-white shadow-md transition hover:bg-[#A67D28]"
            >
              Ingresar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
