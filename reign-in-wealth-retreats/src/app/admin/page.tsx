import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import "@/styles/dashboard.css";
export const metadata: Metadata = {
  title: "Retreat Studio",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <AdminApp />;
}
