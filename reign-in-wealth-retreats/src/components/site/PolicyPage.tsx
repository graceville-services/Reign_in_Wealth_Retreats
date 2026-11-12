import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "./PageIntro";
export function PolicyPage({
  title,
  description,
  content,
  approved,
}: {
  title: string;
  description: string;
  content: string;
  approved: boolean;
}) {
  return (
    <>
      <PageIntro
        eyebrow="CLEAR INFORMATION. CONSIDERED TRAVEL."
        title={title}
        description={description}
      />
      <article className="policy-page section-space section-top-small">
        {!approved && (
          <div className="policy-status">
            <strong>Policy being finalized</strong>
            <p>
              This draft is available for transparency. The approved policy will
              be provided before paid reservations open.
            </p>
          </div>
        )}
        {content.split(/\n\s*\n/).map((p, i) => (
          <p key={i}>
            {p.replace(/^DRAFT FOR BUSINESS REVIEW\s*[—–-]\s*/, "")}
          </p>
        ))}
        <div className="policy-contact">
          <h2>
            A question about <em>the details?</em>
          </h2>
          <Link href="/contact" className="text-link">
            Contact our team <ArrowUpRight size={16} />
          </Link>
        </div>
      </article>
    </>
  );
}
