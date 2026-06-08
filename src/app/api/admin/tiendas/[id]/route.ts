import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/auth";

interface UpdateBody {
  subscriptionActive?: boolean;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "No has iniciado sesión como administrador." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as UpdateBody;

  if (typeof body.subscriptionActive !== "boolean") {
    return NextResponse.json({ error: "Falta el estado de la suscripción." }, { status: 400 });
  }

  const existing = await prisma.shop.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Carnicería no encontrada." }, { status: 404 });
  }

  const shop = await prisma.shop.update({
    where: { id },
    data: { subscriptionActive: body.subscriptionActive },
  });

  return NextResponse.json(shop);
}
