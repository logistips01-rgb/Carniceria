import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<LoginBody>;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Indica tu correo y contraseña." }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { email } });
  if (!shop || !(await verifyPassword(password, shop.passwordHash))) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  await createSession(shop.id);
  return NextResponse.json({ slug: shop.slug });
}
