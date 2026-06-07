import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const body = (await request.json()) as SubscribeBody;

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Suscripción push no válida." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { orderId, p256dh: body.keys.p256dh, auth: body.keys.auth },
    create: { orderId, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ error: "Falta el endpoint de la suscripción." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } });
  return NextResponse.json({ ok: true });
}
