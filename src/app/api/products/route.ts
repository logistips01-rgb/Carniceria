import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");

  const products = await prisma.product.findMany({
    where: all ? undefined : { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(products);
}

interface CreateProductBody {
  name: string;
  category: string;
  unit: string;
  price: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateProductBody>;

  if (!body.name?.trim() || !body.category?.trim() || !body.unit?.trim() || !(Number(body.price) > 0)) {
    return NextResponse.json(
      { error: "Faltan datos del producto (nombre, categoría, unidad o precio)." },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        category: body.category.trim(),
        unit: body.unit.trim(),
        price: Number(body.price),
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese nombre." }, { status: 409 });
    }
    throw error;
  }
}
