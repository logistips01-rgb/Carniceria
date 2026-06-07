import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-6 py-20 text-center">
        <div className="space-y-4">
          <span className="inline-block rounded-full bg-red-100 px-4 py-1 text-sm font-medium text-red-700">
            La plataforma para carnicerías de barrio
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Tu carnicería, con pedidos online
            <br className="hidden sm:block" /> y tu propio enlace
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-600">
            Da de alta tu carnicería, consigue tu propio enlace y código QR, y deja que tus clientes
            encarguen su carne con antelación, reserven su hora de recogida y se olviden de las colas.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/registro"
            className="rounded-lg bg-red-700 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-red-800"
          >
            Da de alta tu carnicería
          </Link>
          <Link
            href="/acceso"
            className="rounded-lg border border-zinc-300 bg-white px-8 py-4 text-base font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100"
          >
            Ya tengo cuenta · Acceder al panel
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-10 text-left sm:grid-cols-3">
          <Feature
            title="Tu propio enlace y QR"
            description="Cada carnicería recibe su propia página de pedidos y un código QR para compartir con sus clientes."
          />
          <Feature
            title="Pedidos sin colas"
            description="Tus clientes encargan con antelación y recogen a la hora reservada, sin esperar turno en el mostrador."
          />
          <Feature
            title="Catálogo, pedidos e histórico"
            description="Organiza tu catálogo por familias, gestiona los pedidos entrantes y consulta qué se vende más."
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
