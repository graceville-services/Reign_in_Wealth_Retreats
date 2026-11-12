import type { Retreat, SiteSettings, Testimonial } from "../types";
import { db } from "./db";
export function getRetreats(includeUnpublished = false): Retreat[] {
  const rows = db().prepare("SELECT data FROM retreats").all() as {
    data: string;
  }[];
  return rows
    .map((row) => JSON.parse(row.data) as Retreat)
    .filter((r) => includeUnpublished || r.published)
    .sort((a, b) =>
      (a.startDate || "9999").localeCompare(b.startDate || "9999"),
    );
}
export function getRetreat(
  slug: string,
  includeUnpublished = false,
): Retreat | null {
  const row = db()
    .prepare("SELECT data FROM retreats WHERE slug=? OR id=?")
    .get(slug, slug) as { data: string } | undefined;
  if (!row) return null;
  const retreat = JSON.parse(row.data) as Retreat;
  return includeUnpublished || retreat.published ? retreat : null;
}
export function getSettings(): SiteSettings {
  return JSON.parse(
    (
      db().prepare("SELECT data FROM settings WHERE id=1").get() as {
        data: string;
      }
    ).data,
  );
}
export function getTestimonials(includeUnpublished = false): Testimonial[] {
  return (
    db().prepare("SELECT data FROM testimonials").all() as { data: string }[]
  )
    .map((r) => JSON.parse(r.data) as Testimonial)
    .filter((r) => includeUnpublished || (r.published && r.consent));
}
