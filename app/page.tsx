import FormularioReserva from "./components/FormularioReserva";
import PreguntasFrecuentes from "./components/PreguntasFrecuentes";

export default function Home() {
  return (
    <>
      {/* Hero: primera pantalla con título, descripción y botón */}
      <section
        className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/dzoupwn0e/image/upload/w_1920,c_limit,f_auto,q_auto/v1771005492/beautiful-fit-red-girl-working-out_mz9uww.webp')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-10">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">
          Karunkine
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-white/95 sm:text-xl">
          Kinesiología y rehabilitación para tu bienestar. Agendá tu turno y
          empezá a sentirte mejor.
        </p>
        <a
          href="#formulario-reserva"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#d4602c] shadow-lg transition hover:bg-white/95 hover:shadow-xl"
        >
          Reservar
          <span aria-hidden>➜</span>
        </a>
        </div>
      </section>

      {/* Formulario: tarjeta flotante con pestañas (estilo referencia) */}
      <section className="relative z-10 -mt-6 rounded-t-3xl bg-zinc-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <FormularioReserva />
      </section>

      {/* Cómo es el tratamiento */}
      <section id="tratamiento" className="bg-white px-4 py-14 sm:px-6 md:px-10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Cómo es el tratamiento
          </h2>
          <div className="mt-6 space-y-4 text-zinc-600 leading-relaxed">
            <p>
              En la primera consulta hacemos una evaluación para conocer tu historia, el motivo por el que venís y tus objetivos. A partir de ahí armamos un plan de trabajo a tu medida.
            </p>
            <p>
              Las sesiones son individuales y se adaptan a lo que necesitás: pueden incluir ejercicios, trabajo manual y recomendaciones para que puedas seguir en el día a día. La idea es que te vayas sintiendo mejor y con más herramientas.
            </p>
          </div>
        </div>
      </section>

      {/* Actividades - lista minimalista, sin iconos, menos ítems */}
      <section id="actividades" className="bg-zinc-50 px-4 py-14 sm:px-6 md:px-10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Actividades
          </h2>
          <p className="mt-2 text-zinc-600">
            Áreas en las que trabajamos.
          </p>
          <ul className="mt-10 space-y-10">
            <li>
              <h3 className="text-lg font-semibold text-zinc-800">
                Evaluación y consulta inicial
              </h3>
              <p className="mt-1.5 text-zinc-600 leading-relaxed">
                Análisis y plan de tratamiento personalizado según tu necesidad.
              </p>
            </li>
            <li>
              <h3 className="text-lg font-semibold text-zinc-800">
                Dolor de espalda y contracturas
              </h3>
              <p className="mt-1.5 text-zinc-600 leading-relaxed">
                Cervical, lumbar, postura y tratamiento del dolor muscular.
              </p>
            </li>
            <li>
              <h3 className="text-lg font-semibold text-zinc-800">
                Rehabilitación y lesiones deportivas
              </h3>
              <p className="mt-1.5 text-zinc-600 leading-relaxed">
                Post lesión o cirugía, recuperación y prevención en actividad física.
              </p>
            </li>
            <li>
              <h3 className="text-lg font-semibold text-zinc-800">
                Kinesiología respiratoria
              </h3>
              <p className="mt-1.5 text-zinc-600 leading-relaxed">
                Rehabilitación respiratoria y trabajo sobre la función pulmonar.
              </p>
            </li>
            <li>
              <h3 className="text-lg font-semibold text-zinc-800">
                Prevención y mantenimiento
              </h3>
              <p className="mt-1.5 text-zinc-600 leading-relaxed">
                Cuidado continuo, movilidad y bienestar para el día a día.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Preguntas frecuentes (acordeón) */}
      <PreguntasFrecuentes />

      {/* Contacto - estilo “Get in touch”: fondo oscuro, título, párrafo, lista con iconos */}
      <section
        id="contacto"
        className="relative px-4 py-16 sm:px-6 md:px-10"
        style={{
          backgroundColor: "#18181b",
          backgroundImage: `linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Contacto
          </h2>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-zinc-400">
            Escribinos o llamanos para más información. Estamos para ayudarte.
          </p>
          <ul className="mt-10 space-y-8">
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-500">Dirección</p>
                <p className="mt-1 text-white">
                  Dirección del consultorio, localidad
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-500">Teléfono</p>
                <a
                  href="tel:+5492914296636"
                  className="mt-1 block text-white transition hover:text-[#d4602c]"
                >
                  54 9 2914 29-6636
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-500">Instagram</p>
                <a
                  href="https://www.instagram.com/lic.wandaperrin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-white transition hover:text-[#d4602c]"
                >
                  @lic.wandaperrin
                </a>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
