import type { Metadata } from "next";
import { Suspense } from "react";
import ReservationForm from "@/components/booking/ReservationForm";
import "@/styles/dashboard.css";
export const metadata: Metadata = {
  title: "Reserve Your Experience",
  description:
    "Begin your Reign in Wealth retreat journey. Register individually, choose your room preference, and explore your payment options.",
  robots: { index: false, follow: true },
};
export default function ReservePage() {
  return (
    <Suspense
      fallback={
        <div className="booking-shell">
          <p className="dash-loading">Preparing your experience…</p>
        </div>
      }
    >
      <ReservationForm />
    </Suspense>
  );
}
