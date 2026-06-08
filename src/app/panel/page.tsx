import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionShop } from "@/lib/auth";
import { isShopAccountActive, trialEndsAt, BIZUM_PHONE, SUBSCRIPTION_PRICE_LABEL } from "@/lib/billing";
import { formatDate } from "@/lib/format";
import PanelClient from "./PanelClient";
import LogoutButton from "./LogoutButton";

export default async function PanelPage() {
  const shop = await getSessionShop();
  if (!shop) {
    redirect("/acceso");
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const shopUrl = host ? `${protocol}://${host}/${shop.slug}` : `/${shop.slug}`;

  const accountActive = isShopAccountActive(shop);

  if (!accountActive) {
    const pendingOrders = await prisma.order.count({
      where: { shopId: shop.id, status: { in: ["PENDING", "PREPARING", "READY"] } },
    });

    return (
      <TrialExpiredScreen
        shopName={shop.name}
        trialEndedAt={trialEndsAt(shop.createdAt)}
        pendingOrders={pendingOrders}
      />
    );
  }

  return <PanelClient shopSlug={shop.slug} shopName={shop.name} shopUrl={shopUrl} />;
}

function TrialExpiredScreen({
  shopName,
  trialEndedAt,
  pendingOrders,
}: {
  shopName: string;
  trialEndedAt: Date;
  pendingOrders: number;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Tu periodo de prueba ha terminado</h1>
        <p className="mt-2 text-zinc-700">
          <span className="font-medium">{shopName}</span> empezó su prueba gratuita de 3 meses y terminó el{" "}
          <strong>{formatDate(trialEndedAt)}</strong>. Para seguir usando tu panel necesitas activar tu suscripción.
        </p>

        {pendingOrders > 0 && (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            ⚠️ Tienes <strong>{pendingOrders}</strong> {pendingOrders === 1 ? "pedido" : "pedidos"} esperando que los
            gestiones — tu tienda online sigue recibiendo encargos de tus clientes, pero no podrás verlos ni
            prepararlos hasta que reactives tu cuenta.
          </p>
        )}

        <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4">
          <p className="font-semibold text-zinc-900">Cómo reactivar tu cuenta</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700">
            <li>
              Haz un Bizum de <strong>{SUBSCRIPTION_PRICE_LABEL}</strong> al número{" "}
              <strong className="font-mono">{BIZUM_PHONE}</strong>.
            </li>
            <li>Escríbenos confirmando el pago e indicando el nombre de tu carnicería.</li>
            <li>Activaremos tu cuenta y podrás volver a acceder a tu panel al momento.</li>
          </ol>
        </div>

        <div className="mt-5">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
