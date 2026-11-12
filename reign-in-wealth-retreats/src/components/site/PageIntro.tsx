import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function PageIntro({
  eyebrow,
  title,
  italic,
  description,
  image,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  description: string;
  image?: string;
}) {
  return (
    <section className={`page-intro ${image ? "page-intro-image" : ""}`}>
      {image && <img className="intro-backdrop" src={image} alt="" />}
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>
          {title}
          {italic && (
            <>
              <br />
              <em>{italic}</em>
            </>
          )}
        </h1>
        <p className="intro-description">{description}</p>
      </div>
    </section>
  );
}
export function CommunityBanner() {
  return (
    <section className="community-banner">
      <div className="container community-banner-inner">
        <div>
          <p className="eyebrow">A MORE CONNECTED WORLD</p>
          <h2>
            Good company.
            <br />
            <em>Extraordinary possibilities.</em>
          </h2>
        </div>
        <div>
          <p>
            Be the first to discover new destinations, upcoming retreats, and
            invitations to experience more.
          </p>
          <Link className="button button-primary" href="/community">
            Join our global community <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
