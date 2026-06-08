import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminCredentials } from "@/lib/auth";

interface AccesoBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AccesoBody>;
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Indica el correo y la contraseña." }, { status: 400 });
  }

  const valid = await verifyAdminCredentials(email, password);
  if (!valid) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
