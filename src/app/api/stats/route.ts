import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const completedOrders = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    include: { items: { include: { product: true } } },
    orderBy: { pickupTime: "desc" },
  });

  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = completedOrders.length;

  const salesByProduct = new Map<string, { name: string; unit: string; quantity: number; revenue: number }>();
  for (const order of completedOrders) {
    for (const item of order.items) {
      const existing = salesByProduct.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
      } else {
        salesByProduct.set(item.productId, {
          name: item.product.name,
          unit: item.product.unit,
          quantity: item.quantity,
          revenue: item.subtotal,
        });
      }
    }
  }

  const topProducts = Array.from(salesByProduct.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return NextResponse.json({
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalOrders,
    averageTicket: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
    topProducts,
    recentOrders: completedOrders.slice(0, 10),
  });
}
