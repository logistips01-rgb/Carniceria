export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  PREPARING: "Preparando",
  READY: "Listo para recoger",
  COMPLETED: "Entregado",
  CANCELLED: "Cancelado",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PREPARING: "bg-blue-100 text-blue-800 border-blue-300",
  READY: "bg-emerald-100 text-emerald-800 border-emerald-300",
  COMPLETED: "bg-zinc-100 text-zinc-700 border-zinc-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
};

export const STATUS_FLOW: OrderStatus[] = ["PENDING", "PREPARING", "READY", "COMPLETED"];

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  active: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: Product;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  status: OrderStatus;
  notes: string | null;
  total: number;
  createdAt: string;
  items: OrderItem[];
}
