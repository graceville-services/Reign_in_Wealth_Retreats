import { Plus } from "lucide-react";
export const faqItems = [
  {
    category: "Booking",
    q: "How do I reserve my experience?",
    a: "Choose a retreat and explore its details. When reservations open, complete your own traveler registration, choose an occupancy and payment option, and pay securely online. For retreats still being curated, join the destination waitlist to receive the confirmed package first.",
  },
  {
    category: "Booking",
    q: "Is a deposit required? Are payment plans available?",
    a: "Deposit amounts and payment schedules are set for each retreat. Once confirmed, you will see the total price, amount due today, installment dates, and remaining balance before paying. A waitlist registration does not require payment or reserve a place.",
  },
  {
    category: "Traveling together",
    q: "Can I join on my own?",
    a: "You are welcome to express interest as a solo traveler. Choose single occupancy for your own room, or ask our team about double occupancy and roommate arrangements. Room-sharing availability is confirmed separately for each retreat.",
  },
  {
    category: "Traveling together",
    q: "What does double occupancy mean?",
    a: "Double occupancy means two individually registered travelers share one room. The displayed price is per person, unless the package explicitly says otherwise. Registering one traveler does not register or pay for their roommate.",
  },
  {
    category: "Traveling together",
    q: "Does every traveler need to register separately?",
    a: "Yes. Every traveler needs their own registration, contact details, acceptance of the retreat terms, and payment record, even when two people share a room. Add your roommate’s name and email so our team can match your room preferences.",
  },
  {
    category: "Travel essentials",
    q: "Is airfare included?",
    a: "Review the confirmed package inclusions before booking. Airfare is not included unless your retreat explicitly lists it. Do not book non-refundable flights until the team has confirmed your retreat and advised you of the arrival and departure arrangements.",
  },
  {
    category: "Traveling together",
    q: "Can I bring my spouse or family?",
    a: "Contact the team before registering children or requesting family accommodation. Each retreat has its own accommodation, activity, and age requirements. Adult companions register individually; shared rooms are coordinated by the team.",
  },
  {
    category: "Travel essentials",
    q: "Do I need a passport or visa?",
    a: "Entry requirements depend on your nationality, residence, transit route, and destination. Check current official immigration guidance and your airline’s requirements before you book. The team will share retreat-specific preparation information when the package is confirmed.",
  },
  {
    category: "Travel essentials",
    q: "What about travel insurance?",
    a: "Check the requirements in your confirmed retreat package. Arrange suitable travel insurance for your own circumstances, including medical costs, cancellation, and disruption where appropriate. Insurance and visa costs are not included unless explicitly listed.",
  },
  {
    category: "Payments & policies",
    q: "What happens if I need to cancel?",
    a: "Cancellation terms are specific to each retreat and will be available before payment is accepted. Please read the deposit, refund, transfer, and cancellation deadlines carefully. Contact the team to request a cancellation; eligibility depends on the terms accepted when you booked.",
  },
  {
    category: "Payments & policies",
    q: "Can I speak with someone before booking?",
    a: "Of course. Use our contact form and tell us which retreat interests you. You can ask about accommodation, payment options, accessibility, group travel, or what the experience will involve.",
  },
  {
    category: "The experience",
    q: "Do I need to be an investor to join?",
    a: "Our community is designed for curious, ambitious people from a range of backgrounds. Investment exposure is one part of the wider experience. Any property or business exploration is educational; participation does not require an investment and no financial return is promised.",
  },
];
export function FAQ({
  limit,
  category,
}: {
  limit?: number;
  category?: string;
}) {
  const items = faqItems
    .filter((f) => !category || f.category === category)
    .slice(0, limit);
  return (
    <div className="faq-list">
      {items.map((f) => (
        <details key={f.q} className="faq-item">
          <summary>
            {f.q}
            <Plus size={18} aria-hidden="true" />
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
