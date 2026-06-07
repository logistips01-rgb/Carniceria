import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PedidoForm from "./PedidoForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { name: true } });
  if (!shop) return {};
  return { title: `${shop.name} · Carnicería Online` };
}

export default async function TiendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug }, select: { slug: true, name: true } });

  if (!shop) {
    notFound();
  }

  return <PedidoForm shopSlug={shop.slug} shopName={shop.name} />;
}
