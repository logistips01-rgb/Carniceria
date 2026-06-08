"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { trialEndsAt, isShopAccountActive, SUBSCRIPTION_PRICE_LABEL } from "@/lib/billing";

interface AdminShop {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string | null;
  subscriptionActive: boolean;
  createdAt: string;
  _count: { products: number; orders: number };
}

export default function AdminClient() {
  const router = useRouter();
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/tiendas")
      .then((response) => response.json())
      .then((data: AdminShop[]) => {
        if (cancelled) return;
        setShops(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/salir", { method: "POST" });
      router.push("/admin/acceso");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  async function toggleActive(shop: AdminShop) {
    setUpdatingId(shop.id);
    try {
      const response = await fetch(`/api/admin/tiendas/${shop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionActive: !shop.subscriptionActive }),
      });
      if (response.ok) {
        const updated = (await response.json()) as { subscriptionActive: boolean };
        setShops((prev) =>
          prev.map((s) => (s.id === shop.id ? { ...s, subscriptionActive: updated.subscriptionActive } : s)),
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Administración</h1>
          <p className="mt-1 text-zinc-600">
            Carnicerías dadas de alta · {shops.length} en total · cuota {SUBSCRIPTION_PRICE_LABEL}
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

      <div className="mt-6 space-y-3">
        {loading && <p className="text-zinc-500">Cargando carnicerías…</p>}
        {!loading && shops.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
            Todavía no se ha dado de alta ninguna carnicería.
          </p>
        )}
        {shops.map((shop) => (
          <ShopRow key={shop.id} shop={shop} updating={updatingId === shop.id} onToggle={() => toggleActive(shop)} />
        ))}
      </div>
    </div>
  );
}

function ShopRow({ shop, updating, onToggle }: { shop: AdminShop; updating: boolean; onToggle: () => void }) {
  const createdAt = new Date(shop.createdAt);
  const active = isShopAccountActive({ createdAt, subscriptionActive: shop.subscriptionActive });
  const trialEnd = trialEndsAt(createdAt);

  let statusLabel: string;
  let statusClass: string;
  if (shop.subscriptionActive) {
    statusLabel = "Activa · de pago";
    statusClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
  } else if (active) {
    statusLabel = `En prueba · termina el ${formatDate(trialEnd)}`;
    statusClass = "bg-blue-100 text-blue-800 border-blue-300";
  } else {
    statusLabel = "Prueba terminada · sin pagar";
    statusClass = "bg-red-100 text-red-700 border-red-300";
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="min-w-[14rem] flex-1">
        <p className="font-semibold text-zinc-900">{shop.name}</p>
        <p className="text-sm text-zinc-500">
          /{shop.slug} · {shop.email}
          {shop.phone ? ` · ${shop.phone}` : ""}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Alta: {formatDate(createdAt)} · {shop._count.products} productos · {shop._count.orders} pedidos
        </p>
      </div>

      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>{statusLabel}</span>

      <button
        onClick={onToggle}
        disabled={updating}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
          shop.subscriptionActive ? "bg-zinc-600 hover:bg-zinc-700" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {updating ? "Actualizando…" : shop.subscriptionActive ? "Desactivar" : "Activar"}
      </button>
    </div>
  );
}
