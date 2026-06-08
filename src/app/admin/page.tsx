import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const isAdmin = await isAdminSession();
  if (!isAdmin) {
    redirect("/admin/acceso");
  }

  return <AdminClient />;
}
