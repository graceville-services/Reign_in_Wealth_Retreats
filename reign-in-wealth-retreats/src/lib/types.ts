export type RetreatStatus = "announced" | "open" | "sold_out" | "coming_soon";
export type Retreat = {
  id: string;
  slug: string;
  destination: string;
  country: string;
  region: string;
  tagline: string;
  excerpt: string;
  description: string;
  heroImage: string;
  image: string;
  gallery: string[];
  dateLabel: string;
  startDate: string | null;
  endDate: string | null;
  duration: string;
  status: RetreatStatus;
  currency: string;
  priceSingle: number | null;
  priceDouble: number | null;
  depositAmount: number | null;
  installmentCount: number;
  capacity: number;
  hotelName: string | null;
  hotelDescription: string;
  itinerary: { day: string; title: string; description: string }[];
  included: string[];
  excluded: string[];
  highlights: string[];
  travelNotes: string[];
  published: boolean;
  featured: boolean;
  bookingEnabled: boolean;
  cancellationPolicy: string;
  terms: string;
};
export type SiteSettings = {
  brandName: string;
  tagline: string;
  contactEmail: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  parentBrandUrl: string;
  founderImage: string;
  heroVideo: string;
  privacyPolicy: string;
  bookingTerms: string;
  cancellationPolicy: string;
  policiesApproved: boolean;
  analyticsId: string;
};
export type Testimonial = {
  id: string;
  name: string;
  quote: string;
  destination: string;
  image: string;
  videoUrl: string;
  consent: boolean;
  published: boolean;
};
export type Booking = {
  id: string;
  reference: string;
  retreatId: string;
  retreatSlug: string;
  retreatName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  occupancy: "single" | "double";
  roommateName: string;
  roommateEmail: string;
  roomId: string | null;
  paymentChoice: "deposit" | "full" | "installments";
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  installments: {
    number: number;
    amount: number;
    dueDate: string;
    paid: boolean;
  }[];
  notes?: string;
};
export type ApiResult<T = unknown> = {
  data?: T;
  error?: string;
  message?: string;
};
export const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
