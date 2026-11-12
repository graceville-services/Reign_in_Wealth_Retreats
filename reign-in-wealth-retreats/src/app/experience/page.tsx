import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  UsersRound,
  Building2,
  Sparkles,
  Sun,
  Crown,
} from "lucide-react";
import { PageIntro, CommunityBanner } from "@/components/site/PageIntro";
export const metadata: Metadata = {
  title: "The Reign in Wealth experience",
  description:
    "Explore, connect, invest, experience, transform, and reign. Discover the six pillars behind our international retreat experiences.",
};
const pillars = [
  {
    id: "explore",
    title: "Explore",
    line: "Let the world surprise you.",
    text: "Step beyond familiar places and everyday routines. Discover extraordinary destinations through their landscapes, their people, and the stories that make them unforgettable.",
    icon: Compass,
  },
  {
    id: "connect",
    title: "Connect",
    line: "Find your people, everywhere.",
    text: "Share a table, exchange a perspective, and build relationships with people who are curious about what comes next. Meaningful connection is at the heart of every journey.",
    icon: UsersRound,
  },
  {
    id: "invest",
    title: "Invest",
    line: "A wider view of opportunity.",
    text: "Explore global ideas, enterprise, and real estate where included in the itinerary. Learn, ask questions, and expand your understanding of what is possible.",
    icon: Building2,
  },
  {
    id: "experience",
    title: "Experience",
    line: "Be present for the extraordinary.",
    text: "Culture, local food, adventure, and thoughtful moments of luxury. Our vision is to make the journey feel rich in ways that go well beyond the destination.",
    icon: Sparkles,
  },
  {
    id: "transform",
    title: "Transform",
    line: "Create space for what matters.",
    text: "Give yourself room to reflect, reconnect with your faith and purpose, and grow personally. A change of surroundings can become an invitation to a fresh perspective.",
    icon: Sun,
  },
  {
    id: "reign",
    title: "Reign",
    line: "Carry a greater vision home.",
    text: "Return to everyday life with new connections, meaningful memories, and a broader outlook. The journey becomes part of how you see the world — and your place in it.",
    icon: Crown,
  },
];
export default function ExperiencePage() {
  return (
    <>
      <PageIntro
        eyebrow="THE REIGN IN WEALTH EXPERIENCE"
        title="We don’t just travel."
        italic="We expand."
        description="We experience, connect, grow, and discover what becomes possible when we see a little more of the world."
        image="/images/experience.webp"
      />
      <section className="section-space">
        <div className="container experience-intro">
          <p className="eyebrow">SIX PILLARS. ONE GREATER VISION.</p>
          <h2>
            Every journey has a destination.
            <br />
            Ours also has <em>a purpose.</em>
          </h2>
          <p>
            We bring luxury travel together with culture, meaningful
            relationships, wealth education, and faith. The balance feels
            different in every destination. The intention stays the same:
            experience more, and return with more to give.
          </p>
        </div>
        <div className="container pillar-grid">
          {pillars.map((p, i) => (
            <article className="pillar-card" id={p.id} key={p.id}>
              <div className="pillar-top">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <p.icon size={27} strokeWidth={1.3} />
              </div>
              <h3>
                {p.title}
                <span>{p.line}</span>
              </h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
        <div className="container">
          <p className="fine-print centered">
            Investment exposure is educational. Activities vary by retreat and
            do not require an investment or promise financial returns.
          </p>
        </div>
      </section>
      <section className="image-quote-section">
        <img
          src="/images/hero-zanzibar.webp"
          alt="Zanzibar coastline"
          loading="lazy"
        />
        <div>
          <p className="eyebrow light">MORE THAN A VACATION</p>
          <h2>
            A richer life starts
            <br />
            with <em>a wider world.</em>
          </h2>
          <Link href="/retreats" className="button button-cream">
            Find your next experience <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <CommunityBanner />
    </>
  );
}
