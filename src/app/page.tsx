import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        <div className="space-y-4">
          <span className="inline-block rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-700">
            Carnicería de barrio, sin colas ni esperas
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Encarga tu carne online,
            <br className="hidden sm:block" /> recógela cuando esté lista
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-600">
            Elige tus productos, reserva una hora de recogida y olvídate de las colas.
            El carnicero prepara tu pedido a tiempo y tú solo pasas a buscarlo.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/pedido"
            className="rounded-lg bg-red-700 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-red-800"
          >
            Hacer un pedido
          </Link>
          <Link
            href="/panel"
            className="rounded-lg border border-zinc-300 bg-white px-8 py-4 text-base font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100"
          >
            Soy carnicero · Acceder al panel
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-10 text-left sm:grid-cols-3">
          <Feature
            title="Pedidos sin colas"
            description="Encarga con antelación y recoge a la hora reservada, sin esperar tu turno en el mostrador."
          />
          <Feature
            title="Tiempos bajo control"
            description="El carnicero organiza su día viendo de un vistazo qué pedidos tiene y cuándo los recogen."
          />
          <Feature
            title="Histórico de ventas"
            description="Cada carnicería puede consultar qué se vende más y cuándo, para preparar mejor cada jornada."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
    </div>
  );
}
