import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Retreat, money } from "@/lib/types";
import { describeRetreatImage, isDestinationArtwork } from "@/data/media";
export function RetreatCard({
  retreat,
  index = 0,
}: {
  retreat: Retreat;
  index?: number;
}) {
  const price = retreat.priceDouble ?? retreat.priceSingle;
  return (
    <article className="retreat-card">
      <Link href={`/retreats/${retreat.slug}`} className="retreat-card-image">
        <img
          src={retreat.image}
          alt={describeRetreatImage(retreat.image, retreat.destination)}
          loading="lazy"
          width="720"
          height="900"
        />
        <span className="card-tag">
          {retreat.status === "sold_out"
            ? "Fully reserved"
            : retreat.status === "open" && retreat.bookingEnabled
              ? "Reservations open"
              : retreat.status === "coming_soon"
                ? "On the horizon"
                : "The upcoming collection"}
        </span>
        {isDestinationArtwork(retreat.image) && <span className="card-art-label">Destination illustration</span>}
        <span className="card-arrow">
          <ArrowUpRight size={21} />
        </span>
        <span className="card-image-title">
          <span>
            {String(index + 1).padStart(2, "0")} / {retreat.region}
          </span>
          <h3>{retreat.destination}</h3>
        </span>
      </Link>
      <div className="retreat-card-info">
        <p className="card-country">
          <MapPin size={12} />
          {retreat.country}
        </p>
        <h4>{retreat.tagline}</h4>
        <p className="card-date">
          <CalendarDays size={14} />
          {retreat.dateLabel}
        </p>
        <div className="card-bottom">
          <span>
            {price !== null ? (
              <>
                From <strong>{money(price, retreat.currency)}</strong> / person
              </>
            ) : (
              "Pricing to be announced"
            )}
          </span>
          <Link href={`/retreats/${retreat.slug}`}>
            Discover <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
