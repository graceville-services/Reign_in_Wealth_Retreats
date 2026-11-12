import { getSettings } from "@/lib/server/data";
import { PolicyPage } from "@/components/site/PolicyPage";
export const metadata = {
  title: "Cancellation & refunds",
  robots: { index: false, follow: true },
};
export default function Cancellation() {
  const s = getSettings();
  return (
    <PolicyPage
      title="When plans change."
      description="What to know about cancellations, transfers, and refund terms for your retreat."
      content={s.cancellationPolicy}
      approved={s.policiesApproved}
    />
  );
}
