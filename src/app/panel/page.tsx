"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { STATUS_COLORS, STATUS_FLOW, STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";

type Tab = "pedidos" | "historico";
type StatusFilter = "ACTIVE" | OrderStatus | "ALL";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ACTIVE", label: "Activos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "PREPARING", label: "Preparando" },
  { value: "READY", label: "Listos" },
  { value: "COMPLETED", label: "Entregados" },
  { value: "ALL", label: "Todos" },
];

export default function PanelPage() {
  const [tab, setTab] = useState<Tab>("pedidos");

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold text-zinc-900">Panel del carnicero</h1>
      <p className="mt-1 text-zinc-600">Gestiona los pedidos entrantes y consulta cómo va tu negocio.</p>

      <div className="mt-6 flex gap-2 border-b border-zinc-200">
        <TabButton active={tab === "pedidos"} onClick={() => setTab("pedidos")}>
          Pedidos
        </TabButton>
        <TabButton active={tab === "historico"} onClick={() => setTab("historico")}>
          Histórico de ventas
        </TabButton>
      </div>

      <div className="mt-6">{tab === "pedidos" ? <OrdersPanel /> : <HistoryPanel />}</div>
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
