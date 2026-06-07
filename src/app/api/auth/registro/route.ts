import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, isValidSlug, slugify } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

function uniqueConstraintFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const meta = error.meta as
    | { target?: string[]; driverAdapterError?: { cause?: { constraint?: { fields?: string[] } } } }
    | undefined;
  return meta?.target ?? meta?.driverAdapterError?.cause?.constraint?.fields ?? [];
}

interface RegisterBody {
  name: string;
  slug?: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RegisterBody>;

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const slug = (body.slug?.trim() || slugify(name)).toLowerCase();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Indica el nombre de tu carnicería." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Indica un correo electrónico válido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }
  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "El enlace solo puede tener letras minúsculas, números y guiones, y al menos 3 caracteres." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const shop = await prisma.shop.create({
      data: { name, slug, email, passwordHash },
    });
    await createSession(shop.id);
    return NextResponse.json({ slug: shop.slug }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = uniqueConstraintFields(error);
      if (target.includes("slug")) {
        return NextResponse.json({ error: "Ese enlace ya está en uso. Prueba con otro." }, { status: 409 });
      }
      if (target.includes("email")) {
        return NextResponse.json({ error: "Ya existe una cuenta con ese correo electrónico." }, { status: 409 });
      }
    }
    throw error;
  }
}
