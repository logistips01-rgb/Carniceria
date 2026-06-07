import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionShop } from "@/lib/auth";

export async function GET(request: Request) {
  const shop = await getSessionShop();
  if (!shop) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, ...(status ? { status: status as never } : {}) },
    include: { items: { include: { product: true } } },
    orderBy: { pickupTime: "asc" },
  });

  return NextResponse.json(orders);
}
