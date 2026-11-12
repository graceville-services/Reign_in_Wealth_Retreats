import type { MetadataRoute } from "next";
import { getRetreats } from "@/lib/server/data";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || "http://localhost:3000";
  return [
    "",
    "/retreats",
    "/experience",
    "/about",
    "/journal",
    "/journal/ghana-2026",
    "/testimonials",
    "/faq",
    "/contact",
    "/community",
    ...getRetreats().map((r) => `/retreats/${r.slug}`),
  ].map((path) => ({
    url: base + path,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : path.startsWith("/retreats") ? 0.9 : 0.7,
  }));
}
