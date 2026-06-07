import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/types";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:notificaciones@carniceria-online.example";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const STATUS_NOTIFICATIONS: Partial<Record<OrderStatus, { title: string; body: (name: string) => string }>> = {
  PREPARING: {
    title: "Tu pedido está en preparación 🥩",
    body: (name) => `${name}, el carnicero ya está preparando tu pedido.`,
  },
  READY: {
    title: "¡Tu pedido está listo! 🎉",
    body: (name) => `${name}, ya puedes pasar a recoger tu pedido cuando quieras.`,
  },
  CANCELLED: {
    title: "Tu pedido ha sido cancelado",
    body: (name) => `${name}, el carnicero ha cancelado tu pedido. Contacta con la tienda si tienes dudas.`,
  },
};

export async function notifyOrderStatusChange(orderId: string, status: OrderStatus, customerName: string) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const notification = STATUS_NOTIFICATIONS[status];
  if (!notification) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { orderId } });
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body(customerName),
    url: `/pedido/seguimiento?id=${orderId}`,
    tag: `order-${orderId}`,
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
        );
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
        }
      }
    }),
  );
}
