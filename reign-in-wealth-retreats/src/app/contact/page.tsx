import type { Metadata } from "next";
import {
  Mail,
  MessageCircle,
  UsersRound,
  Handshake,
  ArrowUpRight,
} from "lucide-react";
import { getSettings } from "@/lib/server/data";
import { PageIntro } from "@/components/site/PageIntro";
import { ContactForm } from "@/components/site/ContactForm";
export const metadata: Metadata = {
  title: "Let’s talk",
  description:
    "Contact Reign in Wealth Retreats for retreat questions, group travel, partnerships, and sponsorship inquiries.",
};
export default function ContactPage() {
  const s = getSettings();
  const whatsapp = s.whatsapp.replace(/[^0-9]/g, "");
  return (
    <>
      <PageIntro
        eyebrow="THE FIRST STEP IS A CONVERSATION"
        title="A world of possibility."
        italic="Let’s talk about yours."
        description="A question about a retreat, an idea for a partnership, or a group ready to explore — we’d love to hear from you."
      />
      <section className="section-space section-top-small">
        <div className="container contact-layout">
          <aside>
            <h2>
              How can we <em>help?</em>
            </h2>
            <p>
              Tell us what’s on your mind. Our team will help you find your next
              step.
            </p>
            <div className="contact-reasons">
              <div>
                <MessageCircle size={20} />
                <div>
                  <h3>Retreat inquiries</h3>
                  <p>
                    Destinations, accommodation, payment options, and the
                    experience.
                  </p>
                </div>
              </div>
              <div>
                <UsersRound size={20} />
                <div>
                  <h3>Travel together</h3>
                  <p>
                    Group travel, room arrangements, and shared possibilities.
                  </p>
                </div>
              </div>
              <div>
                <Handshake size={20} />
                <div>
                  <h3>Create something meaningful</h3>
                  <p>
                    Partnerships, collaborations, and sponsorship opportunities.
                  </p>
                </div>
              </div>
            </div>
            {s.contactEmail && (
              <a
                className="text-link contact-direct"
                href={`mailto:${s.contactEmail}`}
              >
                <Mail size={16} />
                {s.contactEmail}
              </a>
            )}
            {whatsapp && (
              <a
                className="button button-outline"
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp <ArrowUpRight size={16} />
              </a>
            )}
          </aside>
          <div className="contact-form-panel">
            <p className="eyebrow">SEND A NOTE TO OUR TEAM</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
