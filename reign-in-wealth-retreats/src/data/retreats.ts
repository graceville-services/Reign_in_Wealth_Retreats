import { featuredPhotos } from "./gallery";
import { destinationArtwork } from "./media";
import type { Retreat, SiteSettings, Testimonial } from "@/lib/types";

const shared: Pick<
  Retreat,
  | "currency"
  | "priceSingle"
  | "priceDouble"
  | "depositAmount"
  | "installmentCount"
  | "capacity"
  | "hotelName"
  | "hotelDescription"
  | "published"
  | "bookingEnabled"
  | "cancellationPolicy"
  | "terms"
  | "included"
  | "excluded"
  | "travelNotes"
> = {
  currency: "USD",
  priceSingle: null,
  priceDouble: null,
  depositAmount: null,
  installmentCount: 3,
  capacity: 0,
  hotelName: null,
  hotelDescription:
    "Our accommodation selection is being curated. The hotel, room categories, and confirmed stay details will be shared before reservations open. The imagery shown does not identify a contracted hotel.",
  published: true,
  bookingEnabled: false,
  cancellationPolicy:
    "Destination-specific cancellation, refund, and transfer terms are being finalized. You will receive the approved policy and acknowledge it before making a payment. Joining the interest list does not reserve a place or create a payment obligation.",
  terms:
    "Each traveler must complete a separate registration, including when sharing a room. A roommate preference is a request, not a confirmed room assignment. Package prices, services, and payment deadlines will be confirmed before payment is accepted.",
  included: [
    "The confirmed package inclusions will be published before reservations open.",
  ],
  excluded: [
    "Airfare, visa costs, insurance, and optional activities are not confirmed as included. Review the final package before purchasing any travel.",
  ],
  travelNotes: [
    "Passport, visa, entry, and health requirements depend on your citizenship, travel route, and dates. Verify the current rules with the destination’s official authorities before booking.",
    "Wait for the confirmed retreat and arrival guidance before purchasing nonrefundable flights.",
    "We will share the retreat’s travel insurance requirements and preparation information before reservations open.",
  ],
};

export const retreatSeed: Retreat[] = [
  {
    ...shared,
    id: "retreat-dubai-2026",
    slug: "dubai-2026",
    destination: "Dubai",
    country: "United Arab Emirates",
    region: "Middle East",
    tagline: "A new year. A wider horizon.",
    excerpt:
      "Close the year with extraordinary experiences, meaningful connections, and a fresh perspective on what comes next.",
    description:
      "Step into a city that invites you to think bigger. Our Dubai retreat brings the Reign in Wealth community together for luxury, cultural discovery, conversation, and a memorable welcome to the new year. The retreat dates are announced; accommodations, the final itinerary, package inclusions, and pricing are still being curated. The daily outline below is a proposed experience, not a confirmed schedule.",
    image: destinationArtwork.dubai,
    heroImage: destinationArtwork.dubai,
    gallery: [destinationArtwork.dubai],
    dateLabel: "December 27, 2026 – January 2, 2027",
    startDate: "2026-12-27",
    endDate: "2027-01-02",
    duration: "7 days · 6 nights",
    status: "announced",
    featured: true,
    highlights: [
      "A remarkable new-year setting",
      "Global connections",
      "Culture and city discovery",
      "Space for a fresh vision",
    ],
    itinerary: [
      {
        day: "Proposed day 1",
        title: "Arrive with possibility",
        description:
          "Settle in, meet the community, and begin with a welcoming evening. Arrival arrangements and inclusions will be confirmed.",
      },
      {
        day: "Proposed day 2",
        title: "Discover the city",
        description:
          "An introduction to Dubai’s distinctive cityscape and culture, with time to connect along the way.",
      },
      {
        day: "Proposed day 3",
        title: "Expand your perspective",
        description:
          "Conversations about purpose, enterprise, and global opportunities, balanced with time to explore.",
      },
      {
        day: "Proposed day 4",
        title: "Make room for wonder",
        description:
          "A day shaped around memorable local experiences and unhurried connection. Activities remain to be confirmed.",
      },
      {
        day: "Proposed day 5",
        title: "Welcome the new year",
        description:
          "Reflect on the year and celebrate new possibilities together. The final celebration and any extra costs will be published.",
      },
      {
        day: "Proposed day 6",
        title: "Set a greater intention",
        description:
          "Time for rest, personal reflection, and thoughtful conversations about the year ahead.",
      },
      {
        day: "Proposed day 7",
        title: "Carry the vision home",
        description:
          "Close the experience and prepare for departure, with new connections and a wider outlook.",
      },
    ],
  },
  {
    ...shared,
    id: "retreat-ghana-2027",
    slug: "ghana-2027",
    destination: "Ghana",
    country: "West Africa",
    region: "Africa",
    tagline: "Reconnect with culture. Discover possibility.",
    excerpt:
      "An immersive journey through culture, community, real estate exploration, and the warmth of Ghana.",
    description:
      "Discover Ghana through a journey designed to connect culture, community, and a broader view of opportunity. From meaningful conversations to cultural exploration and exposure to real estate and enterprise, this retreat invites you to see beyond the familiar. The dates are announced; the cities, venues, accommodation, package, and daily program are still being finalized. The outline below is proposed inspiration only. Investment exposure is educational and does not promise any financial outcome.",
    image: featuredPhotos.exploring.src,
    heroImage: featuredPhotos.exploring.src,
    gallery: [featuredPhotos.exploring.src, featuredPhotos.waterfall.src, featuredPhotos.arrival.src],
    dateLabel: "August 5–15, 2027",
    startDate: "2027-08-05",
    endDate: "2027-08-15",
    duration: "11 days · 10 nights",
    status: "announced",
    featured: true,
    highlights: [
      "Culture and heritage",
      "Real estate exploration",
      "Meaningful community",
      "Purpose and personal growth",
    ],
    itinerary: [
      {
        day: "Proposed day 1",
        title: "Welcome to Ghana",
        description:
          "Arrive, settle in, and begin getting to know the people sharing the journey.",
      },
      {
        day: "Proposed day 2",
        title: "Meet the culture",
        description:
          "An introduction to local culture, stories, and the rhythm of Ghanaian life.",
      },
      {
        day: "Proposed day 3",
        title: "Explore your surroundings",
        description:
          "Cultural discovery with time to enjoy local food and conversation. Stops remain to be confirmed.",
      },
      {
        day: "Proposed day 4",
        title: "Look at opportunity differently",
        description:
          "Proposed real estate exploration and educational conversations. Sites and hosts are subject to confirmation.",
      },
      {
        day: "Proposed day 5",
        title: "Listen to the stories",
        description:
          "Space for heritage, reflection, and a deeper appreciation of place.",
      },
      {
        day: "Proposed day 6",
        title: "Pause and reconnect",
        description:
          "A lighter rhythm for personal reflection, rest, and informal connection.",
      },
      {
        day: "Proposed day 7",
        title: "Build meaningful connections",
        description:
          "Community-centered conversations with room to share ideas and experiences.",
      },
      {
        day: "Proposed day 8",
        title: "Experience beyond the familiar",
        description:
          "A proposed excursion shaped around culture and discovery; final locations will be announced.",
      },
      {
        day: "Proposed day 9",
        title: "Travel with purpose",
        description:
          "Time dedicated to faith, purpose, and community. Any service activity will be arranged with a confirmed local partner.",
      },
      {
        day: "Proposed day 10",
        title: "Gather around the table",
        description:
          "A closing opportunity to reflect, share highlights, and celebrate the connections made.",
      },
      {
        day: "Proposed day 11",
        title: "Take the experience with you",
        description:
          "Depart with a new perspective and a community to stay connected with.",
      },
    ],
  },
  {
    ...shared,
    id: "retreat-zanzibar-2027",
    slug: "zanzibar-2027",
    destination: "Zanzibar",
    country: "Tanzania",
    region: "Africa",
    tagline: "Find your stillness. Widen your world.",
    excerpt:
      "An Indian Ocean escape where island beauty, cultural discovery, and meaningful connection meet.",
    description:
      "Let the pace soften and your perspective expand. Our Zanzibar retreat is envisioned as a thoughtfully curated blend of island relaxation, cultural exploration, adventure, and connection. September 2027 is the planned travel month. Exact dates, duration, accommodation, itinerary, and pricing will be announced together; registering interest keeps you in the conversation without creating a reservation.",
    image: destinationArtwork.zanzibar,
    heroImage: destinationArtwork.zanzibar,
    gallery: [destinationArtwork.zanzibar],
    dateLabel: "September 2027 · dates to be confirmed",
    startDate: null,
    endDate: null,
    duration: "Dates being curated",
    status: "coming_soon",
    featured: true,
    highlights: [
      "Indian Ocean serenity",
      "Island culture",
      "Time to reconnect",
      "Personal transformation",
    ],
    itinerary: [],
  },
  {
    ...shared,
    id: "retreat-dominican-republic",
    slug: "dominican-republic",
    destination: "Dominican Republic",
    country: "Caribbean",
    region: "Caribbean",
    tagline: "A Caribbean chapter awaits.",
    excerpt:
      "Tropical beauty, unhurried moments, and a new circle of connection. Be first to hear what is next.",
    description:
      "A new Reign in Wealth experience is on the horizon. Our Dominican Republic retreat is being imagined around relaxation, connection, and unforgettable Caribbean moments. Travel dates, the location, accommodation, duration, and all package details are still to be announced. Join the destination interest list to hear from us as the experience takes shape.",
    image: destinationArtwork.dominican,
    heroImage: destinationArtwork.dominican,
    gallery: [destinationArtwork.dominican],
    dateLabel: "Coming soon",
    startDate: null,
    endDate: null,
    duration: "Details to be announced",
    status: "coming_soon",
    featured: false,
    highlights: [
      "Caribbean beauty",
      "Unhurried discovery",
      "Meaningful connection",
      "Space to recharge",
    ],
    itinerary: [],
  },
];

export const settingsSeed: SiteSettings = {
  brandName: "Reign in Wealth Retreats",
  tagline: "Explore the world. Expand your vision.",
  contactEmail: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  parentBrandUrl: "",
  founderImage: "",
  heroVideo: "",
  analyticsId: "",
  policiesApproved: false,
  privacyPolicy:
    "DRAFT FOR BUSINESS REVIEW — Reign in Wealth Retreats uses the details you choose to submit to respond to inquiries, manage retreat interest, administer traveler registrations, and provide travel-related updates. If you opt in to marketing, we use your email address and destination preferences to send relevant retreat news. You may ask to stop marketing communications. Registration and payment records are accessible to authorized team members. Card details are processed by the configured payment provider and are not stored by this website. The business must confirm its legal identity, contact details, retention periods, processor arrangements, applicable privacy rights, and international data transfer practices before approving and publishing this policy. Do not submit passport numbers or sensitive documents through general inquiry forms.",
  bookingTerms:
    "DRAFT FOR BUSINESS REVIEW — Interest-list registration is free and is not a confirmed booking. Retreat bookings open only after dates, prices, available capacity, package inclusions, and applicable policies are approved. Each traveler must register separately, even when sharing accommodation. Prices are per traveler in the displayed currency. Single occupancy means one traveler requests a room for their own use; double occupancy means two separately registered travelers share a room. Roommate preferences remain subject to confirmation. A booking is confirmed only according to the final published payment and acceptance terms. Any investment-related discussions or property visits are educational exposure, not individualized financial advice or a promise of returns. The business must approve its contractual identity, payment deadlines, responsibility allocation, travel requirements, dispute provisions, and cancellation terms before accepting payments.",
  cancellationPolicy:
    "DRAFT FOR BUSINESS REVIEW — Cancellation and refund terms will be published for each retreat before reservations open. No nonrefundable deposit, cancellation fee, or transfer right is assumed in this draft. The final policy must state how a traveler requests cancellation, the deadlines and amounts that apply, the treatment of payment-plan balances, changes made by the organizer, and the timing and method of any refund. Travelers must acknowledge the approved policy before making payment. Joining an interest list creates no payment obligation.",
};

// Publish only genuine traveler feedback with recorded consent.
export const testimonialSeed: Testimonial[] = [];
