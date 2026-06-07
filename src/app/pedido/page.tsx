"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { isPushSupported, subscribeToOrderNotifications } from "@/lib/push-client";
import type { Order, Product } from "@/lib/types";

type Cart = Record<string, number>; // productId -> cantidad

function nextValidPickupDefault(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);
  date.setSeconds(0, 0);
  // redondear a los próximos 15 minutos
  const remainder = date.getMinutes() % 15;
  if (remainder !== 0) date.setMinutes(date.getMinutes() + (15 - remainder));
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function PedidoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupTime, setPickupTime] = useState(nextValidPickupDefault());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [familyFilter, setFamilyFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const categories = useMemo(() => {
    const groups = new Map<string, Product[]>();
    for (const product of products) {
      const list = groups.get(product.category) ?? [];
      list.push(product);
      groups.set(product.category, list);
    }
    return Array.from(groups.entries());
  }, [products]);

  const visibleCategories = useMemo(
    () => (familyFilter === "ALL" ? categories : categories.filter(([category]) => category === familyFilter)),
    [categories, familyFilter],
  );

  const cartEntries = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({ product: productById.get(productId), quantity }))
        .filter((entry): entry is { product: Product; quantity: number } => Boolean(entry.product)),
    [cart, productById],
  );

  const total = cartEntries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);

  function updateQuantity(productId: string, quantity: number) {
    setCart((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (cartEntries.length === 0) {
      setError("Añade al menos un producto a tu pedido.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          pickupTime: new Date(pickupTime).toISOString(),
          notes,
          items: cartEntries.map((entry) => ({ productId: entry.product.id, quantity: entry.quantity })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo enviar el pedido.");
        return;
      }

      setConfirmedOrder(data as Order);
      setCart({});
      setNotes("");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} onNewOrder={() => setConfirmedOrder(null)} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-zinc-900">Haz tu pedido</h1>
      <p className="mt-1 text-zinc-600">
        Elige tus productos, indica cuándo quieres recogerlos y te lo dejamos preparado.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {loading && <p className="text-zinc-500">Cargando productos…</p>}
          {!loading && categories.length === 0 && (
            <p className="text-zinc-500">No hay productos disponibles ahora mismo.</p>
          )}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFamilyFilter("ALL")}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  familyFilter === "ALL"
                    ? "border-red-700 bg-red-700 text-white"
                    : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Todas
              </button>
              {categories.map(([category]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFamilyFilter(category)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    familyFilter === category
                      ? "border-red-700 bg-red-700 text-white"
                      : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
          {visibleCategories.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">{category}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    quantity={cart[product.id] ?? 0}
                    onChange={(quantity) => updateQuantity(product.id, quantity)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-900">Tu pedido</h2>
            {cartEntries.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">Aún no has añadido productos.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {cartEntries.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center justify-between text-zinc-700">
                    <span>
                      {product.name} · {quantity} {product.unit}
                    </span>
                    <span className="font-medium">{formatCurrency(product.price * quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 text-base font-semibold text-zinc-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-900">Tus datos</h2>
            <Field label="Nombre">
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input"
                placeholder="Tu nombre"
              />
            </Field>
            <Field label="Teléfono">
              <input
                required
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="input"
                placeholder="600 000 000"
              />
            </Field>
            <Field label="Hora de recogida">
              <input
                required
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Notas para el carnicero (opcional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[72px]"
                placeholder="Ej: el solomillo cortado en filetes finos"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-red-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-60"
          >
            {submitting ? "Enviando pedido…" : "Confirmar pedido"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  quantity,
  onChange,
}: {
  product: Product;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const step = product.unit === "kg" ? 0.25 : 1;

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="font-medium text-zinc-900">{product.name}</p>
        <p className="text-sm text-zinc-500">
          {formatCurrency(product.price)} / {product.unit}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, Number((quantity - step).toFixed(2))))}
          className="h-8 w-8 rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
          aria-label={`Quitar ${product.name}`}
        >
          −
        </button>
        <span className="w-12 text-center text-sm font-medium text-zinc-900">
          {quantity > 0 ? `${quantity} ${product.unit}` : "—"}
        </span>
        <button
          type="button"
          onClick={() => onChange(Number((quantity + step).toFixed(2)))}
          className="h-8 w-8 rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100"
          aria-label={`Añadir ${product.name}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function OrderConfirmation({ order, onNewOrder }: { order: Order; onNewOrder: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-6 py-20 text-center">
      <span className="text-4xl">✅</span>
      <h1 className="text-2xl font-bold text-zinc-900">¡Pedido recibido!</h1>
      <p className="text-zinc-600">
        Hemos avisado al carnicero. Recoge tu pedido <strong>{new Date(order.pickupTime).toLocaleString("es-ES")}</strong>.
      </p>
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm">
        <p className="text-sm text-zinc-500">Número de pedido</p>
        <p className="font-mono text-sm font-medium text-zinc-900">{order.id}</p>
        <ul className="mt-3 space-y-1 text-sm text-zinc-700">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.product.name} · {item.quantity} {item.product.unit}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
          <span>Total</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      <NotifyMeCard orderId={order.id} />

      <div className="flex gap-3">
        <button
          onClick={onNewOrder}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Hacer otro pedido
        </button>
        <Link
          href="/"
          className="rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

type NotifyState = "idle" | "loading" | "enabled" | "unsupported" | "error";

function NotifyMeCard({ orderId }: { orderId: string }) {
  const [state, setState] = useState<NotifyState>(() => (isPushSupported() ? "idle" : "unsupported"));
  const [error, setError] = useState<string | null>(null);

  async function handleEnable() {
    setState("loading");
    setError(null);
    try {
      await subscribeToOrderNotifications(orderId);
      setState("enabled");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "No se pudieron activar los avisos.");
    }
  }

  if (state === "unsupported") return null;

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm">
      <p className="font-semibold text-zinc-900">🔔 Avísame cuando esté listo</p>
      <p className="mt-1 text-sm text-zinc-600">
        Activa los avisos en este dispositivo y te enviaremos una notificación en cuanto el carnicero
        marque tu pedido como preparado.
      </p>
      {state === "enabled" ? (
        <p className="mt-3 text-sm font-medium text-emerald-700">✅ Avisos activados para este pedido.</p>
      ) : (
        <button
          onClick={handleEnable}
          disabled={state === "loading"}
          className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
        >
          {state === "loading" ? "Activando…" : "Activar avisos"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
