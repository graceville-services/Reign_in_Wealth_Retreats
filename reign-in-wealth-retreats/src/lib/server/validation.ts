import { z } from "zod";
const text = (n = 500) => z.string().trim().max(n);
export const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
const secureUrl = (value: string) => {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      Boolean(u.hostname) &&
      !u.username &&
      !u.password
    );
  } catch {
    return false;
  }
};
export const asset = z
  .string()
  .max(2000)
  .refine(
    (v) =>
      !v ||
      (/^\/(?:images|api\/media|uploads)\/[a-zA-Z0-9/._-]+$/.test(v) &&
        !v.split("/").includes("..")) ||
      secureUrl(v),
    "Use an uploaded file, /images path, or HTTPS URL.",
  );
const url = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => !v || secureUrl(v), "Use an HTTPS URL.");
const nullableDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();
const amount = z.number().int().min(1).max(100000000).nullable();
export const retreatSchema = z
  .object({
    id: z.string().min(1).max(100),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    destination: text(100).min(1),
    country: text(100).min(1),
    region: text(100),
    tagline: text(200),
    excerpt: text(1000),
    description: text(12000),
    heroImage: asset,
    image: asset,
    gallery: z.array(asset).max(40),
    dateLabel: text(200),
    startDate: nullableDate,
    endDate: nullableDate,
    duration: text(100),
    status: z.enum(["announced", "open", "sold_out", "coming_soon"]),
    currency: z.enum([
      "USD",
      "EUR",
      "GBP",
      "CAD",
      "AUD",
      "NGN",
      "AED",
      "GHS",
      "TZS",
      "DOP",
    ]),
    priceSingle: amount,
    priceDouble: amount,
    depositAmount: amount,
    installmentCount: z.number().int().min(1).max(12),
    capacity: z.number().int().min(0).max(10000),
    hotelName: text(300).nullable(),
    hotelDescription: text(4000),
    itinerary: z
      .array(
        z.object({ day: text(100), title: text(300), description: text(3000) }),
      )
      .max(100),
    included: z.array(text(1000)).max(60),
    excluded: z.array(text(1000)).max(60),
    highlights: z.array(text(1000)).max(60),
    travelNotes: z.array(text(2000)).max(30),
    published: z.boolean(),
    featured: z.boolean(),
    bookingEnabled: z.boolean(),
    cancellationPolicy: text(20000),
    terms: text(20000),
  })
  .strict();
export const settingsSchema = z
  .object({
    brandName: text(200),
    tagline: text(300),
    contactEmail: z.union([email, z.literal("")]),
    whatsapp: text(40).refine((v) => !v || /^[+\d ()-]{6,40}$/.test(v)),
    instagram: url,
    facebook: url,
    tiktok: url,
    youtube: url,
    parentBrandUrl: url,
    founderImage: asset,
    heroVideo: asset,
    privacyPolicy: text(30000),
    bookingTerms: text(30000),
    cancellationPolicy: text(30000),
    policiesApproved: z.boolean(),
    analyticsId: text(100).refine((v) => !v || /^G-[A-Z0-9]+$/.test(v)),
  })
  .strict();
export const testimonialSchema = z
  .object({
    id: text(100).min(1),
    name: text(100).min(1),
    quote: text(3000).min(1),
    destination: text(200),
    image: asset,
    videoUrl: asset,
    consent: z.boolean(),
    published: z.boolean(),
  })
  .strict();
export const quoteSchema = z
  .object({
    retreatSlug: text(100).min(1),
    occupancy: z.enum(["single", "double"]),
    paymentChoice: z.enum(["deposit", "full", "installments"]),
    promoCode: text(60).optional(),
  })
  .strict();
export const bookingSchema = quoteSchema.extend({
  firstName: text(100).min(1),
  lastName: text(100).min(1),
  email,
  phone: text(40).min(5),
  country: text(100).min(2),
  roommateName: text(200).optional(),
  roommateEmail: z.union([email, z.literal("")]).optional(),
  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().optional(),
  notes: text(2000).optional(),
  website: z.literal("").optional(),
});
export const leadSchema = z
  .object({
    name: text(200).optional(),
    email,
    destination: text(100).optional(),
    source: z
      .enum(["waitlist", "newsletter", "information"])
      .default("waitlist"),
    consent: z.literal(true),
    website: z.literal("").optional(),
  })
  .strict();
export const contactSchema = z
  .object({
    name: text(200).min(2),
    email,
    phone: text(40).optional(),
    subject: z.enum(["general", "partnership", "group"]).default("general"),
    message: text(5000).min(10),
    consent: z.literal(true),
    website: z.literal("").optional(),
  })
  .strict();
export const promoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,40}$/),
    type: z.enum(["percent", "fixed"]),
    amount: z.number().int().positive(),
    currency: z
      .enum([
        "USD",
        "EUR",
        "GBP",
        "CAD",
        "AUD",
        "NGN",
        "AED",
        "GHS",
        "TZS",
        "DOP",
      ])
      .default("USD"),
    retreatId: text(100).nullable().default(null),
    maxUses: z.number().int().min(1).max(100000).default(100),
    active: z.boolean().default(true),
    expiresAt: z.string().datetime().nullable().default(null),
  })
  .strict();
