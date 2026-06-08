"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
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
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60"
    >
      {loggingOut ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
