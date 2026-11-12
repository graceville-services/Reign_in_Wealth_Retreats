import type { Metadata } from "next";
import { PageIntro, CommunityBanner } from "@/components/site/PageIntro";
import { RetreatFilters } from "@/components/site/RetreatFilters";
import { getRetreats } from "@/lib/server/data";
export const metadata: Metadata = {
  title: "Our retreats",
  description:
    "Discover the upcoming Reign in Wealth retreat collection: Dubai, Ghana, Zanzibar, and the Dominican Republic.",
};
export default function RetreatsPage() {
  return (
    <>
      <PageIntro
        eyebrow="THE UPCOMING COLLECTION"
        title="The world is waiting."
        italic="Where will you go?"
        description="Thoughtfully curated journeys for people who want more from the world — and more from themselves."
      />
      <section className="section-space section-top-small">
        <div className="container">
          <RetreatFilters retreats={getRetreats()} />
        </div>
      </section>
      <CommunityBanner />
    </>
  );
}
