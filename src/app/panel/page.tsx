import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionShop } from "@/lib/auth";
import PanelClient from "./PanelClient";

export default async function PanelPage() {
  const shop = await getSessionShop();
  if (!shop) {
    redirect("/acceso");
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const shopUrl = host ? `${protocol}://${host}/${shop.slug}` : `/${shop.slug}`;

  return <PanelClient shopSlug={shop.slug} shopName={shop.name} shopUrl={shopUrl} />;
}
