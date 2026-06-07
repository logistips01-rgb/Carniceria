import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({ where: { slug } });
  if (!shop) {
    return NextResponse.json({ error: "Carnicería no encontrada." }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: { shopId: shop.id, active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(products);
}
