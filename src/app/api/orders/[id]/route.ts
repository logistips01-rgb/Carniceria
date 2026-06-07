import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionShop } from "@/lib/auth";
import { notifyOrderStatusChange } from "@/lib/push";
import type { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const shop = await getSessionShop();
  if (!shop) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: string };

  if (!body.status || !VALID_STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: "Estado de pedido no válido." }, { status: 400 });
  }

  const status = body.status as OrderStatus;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing || existing.shopId !== shop.id) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: { include: { product: true } } },
  });

  await notifyOrderStatusChange(order.id, status, order.customerName, shop.slug);

  return NextResponse.json(order);
}

