import FormularioReserva from "./components/FormularioReserva";
import PreguntasFrecuentes from "./components/PreguntasFrecuentes";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/dzoupwn0e/image/upload/w_1920,c_limit,f_auto,q_auto/v1771005492/beautiful-fit-red-girl-working-out_mz9uww.webp')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-medium tracking-wide text-white/90 sm:text-base">
            Conciencia Corporal y Movimiento
          </p>
          <p className="mt-1 text-xs tracking-widest text-white/80 sm:text-sm">
            WANDA PERRIN | Lic. en Kinesiología y Fisiatría
          </p>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
            SENTITE PLENO HABITANDO TU CUERPO
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/95 sm:text-lg">
            Existen herramientas simples y amorosas que podés incorporar en tu día a día
            para el manejo del dolor, mientras implementas los cambios que tu cuerpo necesita.
          </p>
          <p className="mt-3 font-medium text-white">
            Estoy para acompañarte.
          </p>
          <a
            href="#formulario-reserva"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#d4602c] shadow-lg transition hover:bg-white/95 hover:shadow-xl"
          >
            AGENDAR EVALUACIÓN
            <span aria-hidden>➜</span>
          </a>
        </div>
      </section>

      {/* Formulario */}
      <section className="relative z-10 -mt-6 rounded-t-3xl bg-zinc-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <FormularioReserva />
      </section>

      {/* Nuestra visión (antes Tratamiento) */}
      <section id="tratamiento" className="bg-white px-4 py-14 sm:px-6 md:px-10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-semibold text-zinc-800 sm:text-3xl">
            Nuestra visión
          </h2>
          <div className="mt-6 space-y-4 text-zinc-600 leading-relaxed">
            <p>
              Además de lograr el objetivo específico de cada persona y cada sesión, el tratamiento busca generar la propia conciencia de movimiento normal y la capacidad de auto-regular el cuerpo físico con base en una perspectiva integral de la salud.
            </p>
            <p>
              Con esto en mente, el espacio invita a la auto-observación, a explorarnos y escucharnos para conocernos y conectar con nuestras necesidades biológicas hasta alcanzar ese estado de completo bienestar que entendemos por salud.
            </p>
          </div>
        </div>
      </section>

      {/* Consulta Inicial (reemplaza Actividades) */}
      <section id="consulta-inicial" className="bg-zinc-50 px-4 py-14 sm:px-6 md:px-10">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-semibold text-zinc-800 sm:text-3xl">
            ¿En qué consiste la consulta inicial de evaluación?
          </h2>
          <div className="mt-6 space-y-4 text-zinc-600 leading-relaxed">
            <p>
              La evaluación es un recorrido por tu historia corporal. Se trata de un espacio uno a uno destinado a conocer tu estado de salud actual, tu experiencia personal con la salud y el movimiento, tus hábitos y actividades diarias y los objetivos que te acercaron a la consulta.
            </p>
            <p>
              Con la información recopilada le damos forma al Plan Kinésico que detalla los ítems que abordaremos en sesión y se te facilitará vía WhatsApp en formato PDF.
            </p>
            <p>
              Junto con el plan kinésico te haré llegar la Guía de Hábitos para la Salud Integral, con las claves para que tu cuerpo responda de forma eficaz al tratamiento y puedas sostener los resultados en el tiempo.
            </p>
          </div>
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-xl font-semibold text-zinc-800">
              $33.000
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              El turno se reserva una vez recibido el pago.
            </p>
            <p className="mt-3 text-sm font-medium text-zinc-700">
              Modalidad: PRESENCIAL / VIRTUAL
            </p>
            <a
              href="#formulario-reserva"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d4602c] px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              AGENDAR EVALUACIÓN
              <span aria-hidden>➜</span>
            </a>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <PreguntasFrecuentes />

      {/* Footer / Contacto */}
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
            Información de contacto
          </h2>
          <ul className="mt-10 space-y-8">
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-500">Ubicación</p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-white transition hover:text-[#d4602c]"
                >
                  Ver en MAPS
                </a>
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
                  2914 29-6636
                </a>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-500">Mail</p>
                <a
                  href="mailto:lic.wandaperrin@gmail.com"
                  className="mt-1 block text-white transition hover:text-[#d4602c]"
                >
                  lic.wandaperrin@gmail.com
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
