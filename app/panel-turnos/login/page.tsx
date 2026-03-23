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
    <main className="min-h-screen bg-zinc-50 px-4 pb-12 pt-24 sm:px-6 md:px-10">
      <div className="mx-auto w-full max-w-md">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-8">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Acceso al panel
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ingresá tu clave para ver y gestionar los turnos.
          </p>

          <form action="/api/panel-auth/login" method="post" className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value="/panel-turnos" />
            <div>
              <label
                htmlFor="panel-password"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Clave
              </label>
              <input
                id="panel-password"
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none transition focus:border-zinc-500"
                placeholder="Ingresá la clave"
              />
            </div>

            {hasInvalidError && (
              <p className="text-sm font-medium text-red-600" role="alert">
                Clave incorrecta. Intentá nuevamente.
              </p>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Ingresar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
