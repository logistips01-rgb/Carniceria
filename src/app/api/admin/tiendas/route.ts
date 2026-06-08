import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/auth";

export async function GET() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "No has iniciado sesión como administrador." }, { status: 401 });
  }

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      email: true,
      phone: true,
      subscriptionActive: true,
      createdAt: true,
      _count: { select: { products: true, orders: true } },
    },
  });

  return NextResponse.json(shops);
}
