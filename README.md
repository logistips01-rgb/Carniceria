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
- [Prisma](https://www.prisma.io) con SQLite como base de datos

## Puesta en marcha

```bash
npm install        # instala dependencias y genera el cliente de Prisma
npx prisma migrate dev   # crea/actualiza la base de datos local (dev.db)
npm run db:seed    # carga productos de ejemplo
npm run dev        # arranca el servidor de desarrollo en http://localhost:3000
```

## Estructura relevante

- `prisma/schema.prisma`: modelos `Product`, `Order`, `OrderItem`.
- `prisma/seed.ts`: productos de ejemplo para probar la app.
- `src/app/pedido`: flujo de pedido para clientes.
- `src/app/panel`: panel de gestión para el carnicero (pedidos + histórico).
- `src/app/api`: endpoints de productos, pedidos y estadísticas.
