import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionShop } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

interface UpdateProductBody {
  name?: string;
  category?: string;
  unit?: string;
  price?: number;
  active?: boolean;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const shop = await getSessionShop();
  if (!shop) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.shopId !== shop.id) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateProductBody;

  const data: Prisma.ProductUpdateInput = {};

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "El nombre no puede estar vacío." }, { status: 400 });
    }
    data.name = body.name.trim();
  }
  if (body.category !== undefined) {
    if (!body.category.trim()) {
      return NextResponse.json({ error: "La categoría no puede estar vacía." }, { status: 400 });
    }
    data.category = body.category.trim();
  }
  if (body.unit !== undefined) {
    if (!body.unit.trim()) {
      return NextResponse.json({ error: "La unidad no puede estar vacía." }, { status: 400 });
    }
    data.unit = body.unit.trim();
  }
  if (body.price !== undefined) {
    if (!(Number(body.price) > 0)) {
      return NextResponse.json({ error: "El precio debe ser mayor que cero." }, { status: 400 });
    }
    data.price = Number(body.price);
  }
  if (body.active !== undefined) {
    data.active = Boolean(body.active);
  }

  try {
    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese nombre." }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    throw error;
  }
}
