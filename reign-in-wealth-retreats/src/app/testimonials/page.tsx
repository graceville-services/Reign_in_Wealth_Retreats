import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Play } from "lucide-react";
import { getTestimonials } from "@/lib/server/data";
import { PageIntro, CommunityBanner } from "@/components/site/PageIntro";
export const metadata: Metadata = {
  title: "Traveler stories",
  description:
    "Real stories and experiences from the Reign in Wealth Retreats community.",
};
export default function TestimonialsPage() {
  const testimonials = getTestimonials();
  return (
    <>
      <PageIntro
        eyebrow="IN THEIR OWN WORDS"
        title="Every journey"
        italic="leaves a story."
        description="The connections that stay with us. The moments that shift our perspective. The experiences we carry home."
      />
      <section className="section-space section-top-small">
        <div className="container">
          {testimonials.length ? (
            <div className="testimonial-grid">
              {testimonials.map((t) => (
                <article className="testimonial-card" key={t.id}>
                  {t.videoUrl && (
                    <video
                      controls
                      preload="none"
                      poster={t.image || undefined}
                      aria-label={`${t.name}'s retreat testimonial`}
                    >
                      <source src={t.videoUrl} />
                    </video>
                  )}
                  <MessageCircle size={24} />
                  <blockquote>“{t.quote}”</blockquote>
                  <div className="testimonial-person">
                    {t.image && <img src={t.image} alt={t.name} />}
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.destination}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="story-empty">
              <MessageCircle size={33} strokeWidth={1.2} />
              <h2>
                The best stories
                <br />
                are <em>the real ones.</em>
              </h2>
              <p>
                Our traveler reflections are being collected and prepared for
                sharing. Return soon to experience the journey through the
                people who lived it.
              </p>
              <Link className="button button-outline" href="/contact">
                Share your retreat story <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
      <CommunityBanner />
    </>
  );
}
