import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    include: { items: { include: { product: true } } },
    orderBy: { pickupTime: "asc" },
  });

  return NextResponse.json(orders);
}

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderBody {
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  notes?: string;
  items: OrderItemInput[];
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateOrderBody>;

  if (
    !body.customerName?.trim() ||
    !body.customerPhone?.trim() ||
    !body.pickupTime ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    return NextResponse.json(
      { error: "Faltan datos del pedido (cliente, teléfono, hora de recogida o productos)." },
      { status: 400 },
    );
  }

  const pickupTime = new Date(body.pickupTime);
  if (Number.isNaN(pickupTime.getTime())) {
    return NextResponse.json({ error: "La hora de recogida no es válida." }, { status: 400 });
  }

  const productIds = body.items.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productById = new Map(products.map((product) => [product.id, product]));

  let total = 0;
  const itemsToCreate = [];
  for (const item of body.items) {
    const product = productById.get(item.productId);
    if (!product || !(item.quantity > 0)) {
      return NextResponse.json({ error: "Hay productos o cantidades no válidas en el pedido." }, { status: 400 });
    }
    const subtotal = Number((product.price * item.quantity).toFixed(2));
    total += subtotal;
    itemsToCreate.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal,
    });
  }

  const order = await prisma.order.create({
    data: {
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      pickupTime,
      notes: body.notes?.trim() || null,
      total: Number(total.toFixed(2)),
      items: { create: itemsToCreate },
    },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}
