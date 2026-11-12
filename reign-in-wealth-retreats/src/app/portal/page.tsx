import type { Metadata } from "next";
import { Suspense } from "react";
import TravelerPortal from "@/components/portal/TravelerPortal";
import "@/styles/dashboard.css";
export const metadata: Metadata = {
  title: "Your Traveler Portal",
  robots: { index: false, follow: false },
};
export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-shell">
          <p className="dash-loading">Preparing your traveler portal…</p>
        </div>
      }
    >
      <TravelerPortal />
    </Suspense>
  );
}
