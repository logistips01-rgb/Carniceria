# Carnicería Online

Prototipo de plataforma para carnicerías de barrio: pedidos por adelantado, control de tiempos de
recogida, panel de gestión para el carnicero e histórico de ventas. El objetivo es reducir las
colas y la gestión caótica de pedidos, ofreciendo a los clientes la misma comodidad que encuentran
en los supermercados.

## Funcionalidades

- **Catálogo y pedidos online** (`/pedido`): el cliente elige productos por categoría, indica
  cantidad, reserva una hora de recogida y recibe confirmación con resumen del pedido.
- **Panel del carnicero** (`/panel`): listado de pedidos en tiempo real (filtrable por estado),
  con flujo de estados *Pendiente → Preparando → Listo → Entregado* (o cancelación).
- **Histórico de ventas**: ventas totales, ticket medio, productos más vendidos y últimos
  pedidos completados, calculados a partir de los pedidos entregados.

## Stack técnico

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) con PostgreSQL como base de datos (compatible con
  [Neon](https://neon.tech), Supabase o cualquier Postgres estándar a través de `@prisma/adapter-pg`)
- Notificaciones push PWA ([web-push](https://github.com/web-push-libs/web-push)) para avisar al
  cliente cuando su pedido está listo

## Puesta en marcha

1. Copia `.env.example` como `.env` y rellena `DATABASE_URL` con la cadena de conexión de tu base
   de datos Postgres (por ejemplo, una base gratuita de [Neon](https://neon.tech)). Genera también
   un par de claves VAPID con `npx web-push generate-vapid-keys` para las notificaciones push.

```bash
npm install              # instala dependencias y genera el cliente de Prisma
npx prisma migrate deploy   # aplica las migraciones a la base de datos
npm run db:seed          # carga productos de ejemplo
npm run dev              # arranca el servidor de desarrollo en http://localhost:3000
```

## Despliegue (Vercel + Neon)

1. Crea una base de datos gratuita en [Neon](https://neon.tech) y copia su cadena de conexión
   (`postgresql://usuario:contraseña@host/basededatos?sslmode=require`).
2. Importa este repositorio en [Vercel](https://vercel.com) y, en la configuración del proyecto,
   añade las variables de entorno `DATABASE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (los mismos valores que tienes en tu `.env`).
3. Despliega: el script `build` ejecuta `prisma migrate deploy` antes de `next build`, así que las
   migraciones se aplican automáticamente en cada despliegue.

## Estructura relevante

- `prisma/schema.prisma`: modelos `Product`, `Order`, `OrderItem`, `PushSubscription`.
- `prisma/seed.ts`: productos de ejemplo para probar la app.
- `src/app/pedido`: flujo de pedido para clientes (incluye suscripción a notificaciones push).
- `src/app/panel`: panel de gestión para el carnicero (pedidos + histórico).
- `src/app/api`: endpoints de productos, pedidos, suscripciones push y estadísticas.
- `src/lib/push.ts`, `src/lib/push-client.ts`, `public/sw.js`: lógica de notificaciones push PWA.
