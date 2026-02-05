export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Karunkine
        </h1>
        <button
          type="button"
          className="rounded-full bg-foreground px-8 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Reservar
        </button>
      </main>
    </div>
  );
}
