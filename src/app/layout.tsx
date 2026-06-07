import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carnicería Online · Pedidos sin colas",
  description: "Encarga tu carne con antelación, reserva tu hora de recogida y olvídate de las esperas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
              🥩 Carnicería <span className="text-red-700">Online</span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-zinc-600">
              <Link href="/pedido" className="transition hover:text-red-700">
                Hacer pedido
              </Link>
              <Link href="/panel" className="transition hover:text-red-700">
                Panel carnicero
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
