"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { STATUS_COLORS, STATUS_FLOW, STATUS_LABELS, type Order, type OrderStatus, type Product } from "@/lib/types";

type Tab = "pedidos" | "productos" | "historico" | "enlace";
type StatusFilter = "ACTIVE" | OrderStatus | "ALL";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Activos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "PREPARING", label: "Preparando" },
  { value: "READY", label: "Listos" },
  { value: "COMPLETED", label: "Entregados" },
  { value: "ALL", label: "Todos" },
];

export default function PanelClient({
  shopSlug,
  shopName,
  shopUrl,
}: {
  shopSlug: string;
  shopName: string;
  shopUrl: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pedidos");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/salir", { method: "POST" });
      router.push("/acceso");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Panel del carnicero</h1>
          <p className="mt-1 text-zinc-600">
            <span className="font-medium text-zinc-800">{shopName}</span> · gestiona tus pedidos y consulta cómo va tu negocio.
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60"
        >
          {loggingOut ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200">
        <TabButton active={tab === "pedidos"} onClick={() => setTab("pedidos")}>
          Pedidos
        </TabButton>
        <TabButton active={tab === "productos"} onClick={() => setTab("productos")}>
          Productos
        </TabButton>
        <TabButton active={tab === "historico"} onClick={() => setTab("historico")}>
          Histórico de ventas
        </TabButton>
        <TabButton active={tab === "enlace"} onClick={() => setTab("enlace")}>
          Mi enlace y QR
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === "pedidos" && <OrdersPanel />}
        {tab === "productos" && <ProductsPanel />}
        {tab === "historico" && <HistoryPanel />}
        {tab === "enlace" && <EnlacePanel shopSlug={shopSlug} shopName={shopName} shopUrl={shopUrl} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active ? "border-red-700 text-red-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch("/api/orders")
        .then((response) => response.json())
        .then((data: Order[]) => {
          if (cancelled) return;
          setOrders(data);
          setLoading(false);
        });
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const visibleOrders = orders.filter((order) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return order.status === "PENDING" || order.status === "PREPARING" || order.status === "READY";
    return order.status === filter;
  });

  async function advanceStatus(order: Order, nextStatus: OrderStatus) {
    setUpdatingId(order.id);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (response.ok) {
        const updated = (await response.json()) as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === option.value
                ? "border-red-700 bg-red-700 text-white"
                : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="text-zinc-500">Cargando pedidos…</p>}
        {!loading && visibleOrders.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
            No hay pedidos en esta categoría.
          </p>
        )}
        {visibleOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            updating={updatingId === order.id}
            onAdvance={(next) => advanceStatus(order, next)}
            onCancel={() => advanceStatus(order, "CANCELLED")}
          />
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  updating,
  onAdvance,
  onCancel,
}: {
  order: Order;
  updating: boolean;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
}) {
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;
  const canCancel = order.status === "PENDING" || order.status === "PREPARING";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-zinc-900">{order.customerName}</p>
          <p className="text-sm text-zinc-500">{order.customerPhone}</p>
          <p className="mt-1 text-sm text-zinc-700">
            Recogida: <strong>{formatDateTime(order.pickupTime)}</strong>
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm text-zinc-700">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.product.name} · {item.quantity} {item.product.unit}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      {order.notes && <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">📝 {order.notes}</p>}

      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
        <span className="font-semibold text-zinc-900">{formatCurrency(order.total)}</span>
        <div className="flex gap-2">
          {canCancel && (
            <button
              onClick={onCancel}
              disabled={updating}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onAdvance(nextStatus)}
              disabled={updating}
              className="rounded-lg bg-red-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
            >
              {updating ? "Actualizando…" : `Marcar como "${STATUS_LABELS[nextStatus]}"`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products?all=1")
      .then((response) => response.json())
      .then((data: Product[]) => {
        if (cancelled) return;
        setProducts(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function sortProducts(list: Product[]) {
    return [...list].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  function handleCreated(product: Product) {
    setProducts((prev) => sortProducts([...prev, product]));
  }

  function handleUpdated(product: Product) {
    setProducts((prev) => sortProducts(prev.map((p) => (p.id === product.id ? product : p))));
  }

  const families = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort((a, b) => a.localeCompare(b)), [products]);

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const list = map.get(product.category) ?? [];
      list.push(product);
      map.set(product.category, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  if (loading) return <p className="text-sm text-zinc-500">Cargando catálogo…</p>;

  return (
    <div className="space-y-8">
      <NewProductForm families={families} onCreated={handleCreated} />

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Catálogo por familias</h2>
        {products.length === 0 && (
          <p className="mt-2 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
            Todavía no has añadido ningún producto.
          </p>
        )}
        <div className="mt-4 space-y-6">
          {grouped.map(([family, items]) => (
            <div key={family}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{family}</h3>
              <div className="mt-2 space-y-2">
                {items.map((product) => (
                  <ProductRow key={product.id} product={product} onUpdated={handleUpdated} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const NEW_FAMILY = "__new__";

function NewProductForm({ families, onCreated }: { families: string[]; onCreated: (product: Product) => void }) {
  const [name, setName] = useState("");
  const [family, setFamily] = useState(() => families[0] ?? NEW_FAMILY);
  const [newFamily, setNewFamily] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = family === NEW_FAMILY ? newFamily.trim() : family;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, unit, price: Number(price) }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se ha podido crear el producto.");
        return;
      }
      onCreated(data as Product);
      setName("");
      setPrice("");
      if (family === NEW_FAMILY) {
        setFamily(category);
        setNewFamily("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Añadir producto</h2>
      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input"
          placeholder="Nombre (p. ej. Solomillo de cerdo)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <select className="input" value={family} onChange={(event) => setFamily(event.target.value)}>
          {families.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={NEW_FAMILY}>+ Nueva familia…</option>
        </select>

        {family === NEW_FAMILY && (
          <input
            className="input"
            placeholder="Nombre de la familia (p. ej. Cerdo)"
            value={newFamily}
            onChange={(event) => setNewFamily(event.target.value)}
            required
          />
        )}

        <input
          className="input"
          placeholder="Unidad (p. ej. kg, unidad)"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          required
        />
        <input
          className="input"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Precio (€)"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={submitting || !category}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {submitting ? "Guardando…" : "Añadir producto"}
          </button>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>
      </form>
    </section>
  );
}

function ProductRow({ product, onUpdated }: { product: Product; onUpdated: (product: Product) => void }) {
  const [unit, setUnit] = useState(product.unit);
  const [price, setPrice] = useState(String(product.price));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = unit !== product.unit || Number(price) !== product.price;

  async function update(data: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "No se ha podido actualizar el producto.");
        return;
      }
      onUpdated(result as Product);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="min-w-[12rem] flex-1">
        <p className="font-medium text-zinc-900">{product.name}</p>
      </div>

      <input
        className="input w-28"
        value={unit}
        onChange={(event) => setUnit(event.target.value)}
        aria-label={`Unidad de ${product.name}`}
      />
      <div className="flex items-center gap-1">
        <input
          className="input w-24"
          type="number"
          step="0.01"
          min="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          aria-label={`Precio de ${product.name}`}
        />
        <span className="text-sm text-zinc-500">€</span>
      </div>

      <button
        onClick={() => update({ unit, price: Number(price) })}
        disabled={!dirty || saving || !(Number(price) > 0) || !unit.trim()}
        className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
      >
        Guardar
      </button>

      <button
        onClick={() => update({ active: !product.active })}
        disabled={saving}
        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
          product.active
            ? "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        {product.active ? "Desactivar" : "Activar"}
      </button>

      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  topProducts: { name: string; unit: string; quantity: number; revenue: number }[];
  recentOrders: Order[];
}

function HistoryPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data: Stats) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500">Cargando histórico…</p>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ventas totales" value={formatCurrency(stats.totalRevenue)} />
        <StatCard label="Pedidos completados" value={String(stats.totalOrders)} />
        <StatCard label="Ticket medio" value={formatCurrency(stats.averageTicket)} />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Productos más vendidos</h2>
        {stats.topProducts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Todavía no hay ventas completadas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.topProducts.map((product) => (
              <li
                key={product.name}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span className="font-medium text-zinc-800">{product.name}</span>
                <span className="text-zinc-500">
                  {product.quantity} {product.unit} vendidos
                </span>
                <span className="font-semibold text-zinc-900">{formatCurrency(product.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Últimos pedidos completados</h2>
        {stats.recentOrders.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Aún no se ha completado ningún pedido.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm"
              >
                <div>
                  <p className="font-medium text-zinc-800">{order.customerName}</p>
                  <p className="text-zinc-500">{formatDateTime(order.pickupTime)}</p>
                </div>
                <span className="font-semibold text-zinc-900">{formatCurrency(order.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function EnlacePanel({ shopSlug, shopName, shopUrl }: { shopSlug: string; shopName: string; shopUrl: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(shopUrl, { width: 320, margin: 2 })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [shopUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Tu enlace de pedidos</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Comparte este enlace con tus clientes para que hagan pedidos directamente en {shopName}.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
            {shopUrl}
          </code>
          <button
            onClick={handleCopy}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            {copied ? "¡Copiado!" : "Copiar enlace"}
          </button>
          <a
            href={shopUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
          >
            Abrir
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Código QR de tu carnicería</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Imprímelo y colócalo en el mostrador o el escaparate para que tus clientes accedan con el móvil sin escribir nada.
        </p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt={`Código QR de ${shopName}`}
              width={208}
              height={208}
              unoptimized
              className="rounded-lg border border-zinc-200 bg-white p-2"
            />
          ) : (
            <div className="flex h-[208px] w-[208px] items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400">
              Generando…
            </div>
          )}
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`qr-${shopSlug}.png`}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Descargar código QR
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
