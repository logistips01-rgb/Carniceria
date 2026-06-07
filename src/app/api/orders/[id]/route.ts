import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { status?: string };

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Estado de pedido no válido." }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: body.status as never },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json(order);
}
