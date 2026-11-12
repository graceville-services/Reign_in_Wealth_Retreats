import { getSettings } from "@/lib/server/data";
import { PolicyPage } from "@/components/site/PolicyPage";
export const metadata = {
  title: "Privacy policy",
  robots: { index: false, follow: true },
};
export default function Privacy() {
  const s = getSettings();
  return (
    <PolicyPage
      title="Your privacy matters."
      description="How we handle the information you choose to share with Reign in Wealth Retreats."
      content={s.privacyPolicy}
      approved={s.policiesApproved}
    />
  );
}
