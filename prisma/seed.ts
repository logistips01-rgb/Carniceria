import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const products = [
  { name: "Solomillo de cerdo", category: "Cerdo", unit: "kg", price: 12.5 },
  { name: "Chuletas de cerdo", category: "Cerdo", unit: "kg", price: 7.9 },
  { name: "Panceta", category: "Cerdo", unit: "kg", price: 6.5 },
  { name: "Entrecot de ternera", category: "Ternera", unit: "kg", price: 18.9 },
  { name: "Filete de ternera", category: "Ternera", unit: "kg", price: 16.5 },
  { name: "Carne picada mixta", category: "Ternera", unit: "kg", price: 9.8 },
  { name: "Pechuga de pollo", category: "Pollo", unit: "kg", price: 6.9 },
  { name: "Muslos de pollo", category: "Pollo", unit: "kg", price: 4.5 },
  { name: "Pollo entero", category: "Pollo", unit: "unidad", price: 8.5 },
  { name: "Chorizo casero", category: "Embutidos", unit: "kg", price: 8.9 },
  { name: "Morcilla", category: "Embutidos", unit: "kg", price: 7.5 },
  { name: "Costillas de cordero", category: "Cordero", unit: "kg", price: 15.9 },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }
  console.log(`Seed completado: ${products.length} productos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
