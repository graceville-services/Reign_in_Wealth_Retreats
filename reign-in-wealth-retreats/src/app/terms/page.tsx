import { getSettings } from "@/lib/server/data";
import { PolicyPage } from "@/components/site/PolicyPage";
export const metadata = {
  title: "Booking terms",
  robots: { index: false, follow: true },
};
export default function Terms() {
  const s = getSettings();
  return (
    <PolicyPage
      title="The details of your journey."
      description="Clear booking information, so you can make an informed decision about your retreat."
      content={s.bookingTerms}
      approved={s.policiesApproved}
    />
  );
}
