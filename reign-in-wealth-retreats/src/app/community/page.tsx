import type { Metadata } from "next";
import { LeadForm } from "@/components/site/LeadForm";
export const metadata: Metadata = {
  title: "Join our global community",
  description:
    "Receive destination updates, new retreat announcements, and invitations from Reign in Wealth Retreats.",
};
export default function CommunityPage() {
  return (
    <section className="community-page">
      <div className="community-visual">
        <img src="/images/hero-zanzibar.webp" alt="Zanzibar coastline" />
        <div>
          <p className="eyebrow light">A MORE CONNECTED WORLD</p>
          <h1>
            New places.
            <br />
            Your people.
            <br />
            <em>More possibility.</em>
          </h1>
        </div>
      </div>
      <div className="community-form-wrap">
        <p className="eyebrow">THE REIGN IN WEALTH COMMUNITY</p>
        <h2>
          Your next chapter
          <br />
          <em>starts here.</em>
        </h2>
        <p>
          Be first to hear about our upcoming retreats, new destinations, and
          thoughtfully curated global experiences.
        </p>
        <LeadForm />
      </div>
    </section>
  );
}
