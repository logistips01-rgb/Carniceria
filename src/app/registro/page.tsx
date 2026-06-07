"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidSlug, slugify } from "@/lib/slug";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se ha podido crear la cuenta.");
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const slugPreview = slug || "tu-carniceria";
  const slugValid = slug.length === 0 || isValidSlug(slug);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-zinc-900">Da de alta tu carnicería</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Crea tu cuenta y consigue tu propio enlace para que tus clientes hagan pedidos online.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">Nombre de la carnicería</span>
          <input
            required
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            className="input"
            placeholder="Carnicería Martínez"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">Tu enlace</span>
          <input
            required
            value={slug}
            onChange={(event) => handleSlugChange(event.target.value)}
            className="input"
            placeholder="carniceria-martinez"
          />
          <span className={`mt-1 block text-xs ${slugValid ? "text-zinc-500" : "text-red-600"}`}>
            carniceria-online.example/{slugPreview}
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">Correo electrónico</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            placeholder="tu@carniceria.com"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-zinc-700">Contraseña</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
            placeholder="Mínimo 8 caracteres"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-red-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-60"
        >
          {submitting ? "Creando cuenta…" : "Crear mi carnicería"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        ¿Ya tienes una cuenta?{" "}
        <Link href="/acceso" className="font-medium text-red-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
