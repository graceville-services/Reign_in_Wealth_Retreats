import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/site/PageIntro";
import { FAQ, faqItems } from "@/components/site/FAQ";
export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Find answers about retreat registration, room sharing, payment plans, travel preparation, and cancellation policies.",
};
export default function FAQPage() {
  const categories = [...new Set(faqItems.map((f) => f.category))];
  return (
    <>
      <PageIntro
        eyebrow="BEFORE YOUR NEXT CHAPTER"
        title="A little clarity."
        italic="A lot to look forward to."
        description="From your first question to your final travel preparations, we want every step to feel considered."
      />
      <section className="section-space section-top-small">
        <div className="container faq-page-layout">
          <aside className="faq-category-nav">
            <p className="eyebrow">FIND YOUR ANSWER</p>
            {categories.map((c, i) => (
              <a key={c} href={`#category-${i}`}>
                {c}
                <ArrowUpRight size={14} />
              </a>
            ))}
            <div>
              <h3>Still curious?</h3>
              <p>Let’s talk about your next experience.</p>
              <Link className="text-link" href="/contact">
                Contact our team <ArrowUpRight size={15} />
              </Link>
            </div>
          </aside>
          <div>
            {categories.map((c, i) => (
              <section className="faq-category" key={c} id={`category-${i}`}>
                <h2>{c}</h2>
                <FAQ category={c} />
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
