"use client";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { Retreat } from "@/lib/types";
import { api, json } from "./api";

const emptyRetreat: Retreat = {
  id: "",
  slug: "",
  destination: "",
  country: "",
  region: "",
  tagline: "",
  excerpt: "",
  description: "",
  heroImage: "/images/illustrations/zanzibar.svg",
  image: "/images/illustrations/zanzibar.svg",
  gallery: [],
  dateLabel: "Dates to be announced",
  startDate: null,
  endDate: null,
  duration: "",
  status: "coming_soon",
  currency: "USD",
  priceSingle: null,
  priceDouble: null,
  depositAmount: null,
  installmentCount: 3,
  capacity: 20,
  hotelName: null,
  hotelDescription: "Accommodation details will be shared when confirmed.",
  itinerary: [],
  included: [],
  excluded: [],
  highlights: [],
  travelNotes: [],
  published: false,
  featured: false,
  bookingEnabled: false,
  cancellationPolicy: "",
  terms: "",
};
const sections = [
  "Essentials",
  "Packages",
  "Experience",
  "Photography",
  "Publication",
];
const lines = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
export default function RetreatEditor({
  retreat,
  onSaved,
  onCancel,
}: {
  retreat?: Retreat;
  onSaved: (retreat: Retreat) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Retreat>(() =>
    retreat ? structuredClone(retreat) : structuredClone(emptyRetreat),
  );
  const [section, setSection] = useState(0);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const update = <K extends keyof Retreat>(key: K, value: Retreat[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  async function save(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      const { id, ...values } = draft;
      const saved = await api<Retreat>(
        retreat ? `/api/admin/retreats/${retreat.id}` : "/api/admin/retreats",
        json(retreat ? "PATCH" : "POST", retreat ? draft : values),
      );
      onSaved(saved);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  const priceField = (
    key: "priceSingle" | "priceDouble" | "depositAmount",
    title: string,
    note: string,
  ) => (
    <label className="dash-field">
      <span>
        {title} ({draft.currency})
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={draft[key] == null ? "" : draft[key]! / 100}
        onChange={(e) =>
          update(
            key,
            e.target.value === ""
              ? null
              : Math.round(Number(e.target.value) * 100),
          )
        }
        placeholder="Not yet confirmed"
      />
      <small>{note}</small>
    </label>
  );
  return (
    <div className="dash-editor">
      <div className="dash-section-head">
        <div>
          <p className="dash-kicker">Your retreat collection</p>
          <h2>
            {retreat ? `Edit ${retreat.destination}` : "A new destination."}
          </h2>
        </div>
        <button className="dash-btn secondary small" onClick={onCancel}>
          <ArrowLeft size={13} />
          Collection
        </button>
      </div>
      <div className="dash-editor-nav" aria-label="Retreat editor sections">
        {sections.map((s, i) => (
          <button
            key={s}
            type="button"
            className={section === i ? "active" : ""}
            onClick={() => setSection(i)}
          >
            {s}
          </button>
        ))}
      </div>
      {error && (
        <div className="dash-alert error" role="alert">
          <CircleAlert size={16} />
          {error}
        </div>
      )}
      <form onSubmit={save}>
        {section === 0 && (
          <>
            <div className="dash-two">
              <label className="dash-field">
                <span>Destination name</span>
                <input
                  value={draft.destination}
                  onChange={(e) => update("destination", e.target.value)}
                  required
                  maxLength={120}
                  placeholder="Accra & Cape Coast"
                />
              </label>
              <label className="dash-field">
                <span>Country</span>
                <input
                  value={draft.country}
                  onChange={(e) => update("country", e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Ghana"
                />
              </label>
            </div>
            <div className="dash-two">
              <label className="dash-field">
                <span>Page address</span>
                <input
                  value={draft.slug}
                  onChange={(e) =>
                    update(
                      "slug",
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={100}
                  placeholder="ghana-2027"
                />
                <small>/retreats/{draft.slug || "your-destination"}</small>
              </label>
              <label className="dash-field">
                <span>Region</span>
                <input
                  value={draft.region}
                  onChange={(e) => update("region", e.target.value)}
                  required
                  maxLength={80}
                  placeholder="West Africa"
                />
              </label>
            </div>
            <label className="dash-field">
              <span>Headline or tagline</span>
              <input
                value={draft.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                maxLength={220}
              />
            </label>
            <label className="dash-field">
              <span>Short introduction</span>
              <textarea
                value={draft.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
                maxLength={500}
                rows={3}
              />
            </label>
            <label className="dash-field">
              <span>Destination overview</span>
              <textarea
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                maxLength={6000}
                rows={6}
              />
            </label>
            <div className="dash-three">
              <label className="dash-field">
                <span>Start date, if confirmed</span>
                <input
                  type="date"
                  value={draft.startDate?.slice(0, 10) || ""}
                  onChange={(e) => update("startDate", e.target.value || null)}
                />
              </label>
              <label className="dash-field">
                <span>End date, if confirmed</span>
                <input
                  type="date"
                  min={draft.startDate?.slice(0, 10) || undefined}
                  value={draft.endDate?.slice(0, 10) || ""}
                  onChange={(e) => update("endDate", e.target.value || null)}
                />
              </label>
              <label className="dash-field">
                <span>Duration label</span>
                <input
                  value={draft.duration}
                  onChange={(e) => update("duration", e.target.value)}
                  maxLength={80}
                  placeholder="7 days · 6 nights"
                />
              </label>
            </div>
            <label className="dash-field">
              <span>Display date</span>
              <input
                value={draft.dateLabel}
                onChange={(e) => update("dateLabel", e.target.value)}
                required
                maxLength={180}
                placeholder="August 5–15, 2027"
              />
              <small>
                This text appears on destination cards. It can show an
                unconfirmed month without inventing dates.
              </small>
            </label>
          </>
        )}
        {section === 1 && (
          <>
            <div className="dash-notice">
              Enter prices in whole currency units, for example{" "}
              <strong>2500</strong> for $2,500. Each price is for{" "}
              <strong>one traveler</strong>. Leave unconfirmed amounts empty.
            </div>
            <div className="dash-two">
              <label className="dash-field">
                <span>Currency</span>
                <select
                  value={draft.currency}
                  onChange={(e) => update("currency", e.target.value)}
                >
                  {["USD", "GBP", "EUR", "CAD", "NGN", "AED"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="dash-field">
                <span>Traveler capacity</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={draft.capacity}
                  onChange={(e) => update("capacity", Number(e.target.value))}
                  required
                />
                <small>
                  Number of travelers, separate from room assignments.
                </small>
              </label>
            </div>
            <div className="dash-two">
              {priceField(
                "priceDouble",
                "Double occupancy, per person",
                "One traveler sharing a room with one other traveler.",
              )}
              {priceField(
                "priceSingle",
                "Single occupancy, per person",
                "One traveler with a room to themselves.",
              )}
            </div>
            <div className="dash-two">
              {priceField(
                "depositAmount",
                "Deposit per person",
                "The initial payment toward the package total.",
              )}
              <label className="dash-field">
                <span>Payment plan installments</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={draft.installmentCount}
                  onChange={(e) =>
                    update("installmentCount", Number(e.target.value))
                  }
                />
                <small>
                  Includes the initial payment. Payment dates are calculated by
                  the server.
                </small>
              </label>
            </div>
            <hr className="dash-divider" />
            <label className="dash-field">
              <span>Confirmed hotel or resort</span>
              <input
                value={draft.hotelName || ""}
                onChange={(e) => update("hotelName", e.target.value || null)}
                maxLength={180}
                placeholder="Leave empty until contracted"
              />
            </label>
            <label className="dash-field">
              <span>Accommodation description</span>
              <textarea
                value={draft.hotelDescription}
                onChange={(e) => update("hotelDescription", e.target.value)}
                maxLength={2500}
              />
            </label>
            <label className="dash-field">
              <span>Retreat-specific booking terms</span>
              <textarea
                value={draft.terms}
                onChange={(e) => update("terms", e.target.value)}
                maxLength={12000}
                rows={6}
              />
              <small>
                Include the package payment schedule, fulfillment, and any
                traveler eligibility conditions.
              </small>
            </label>
            <label className="dash-field">
              <span>Retreat-specific cancellation and refund terms</span>
              <textarea
                value={draft.cancellationPolicy}
                onChange={(e) => update("cancellationPolicy", e.target.value)}
                maxLength={12000}
                rows={6}
              />
              <small>
                Publish only the policy approved for this departure.
              </small>
            </label>
          </>
        )}
        {section === 2 && (
          <>
            <div className="dash-section-head">
              <h3>Day by day</h3>
              <button
                type="button"
                className="dash-btn secondary small"
                onClick={() =>
                  update("itinerary", [
                    ...draft.itinerary,
                    {
                      day: `Day ${draft.itinerary.length + 1}`,
                      title: "",
                      description: "",
                    },
                  ])
                }
              >
                <Plus size={13} />
                Add a day
              </button>
            </div>
            {draft.itinerary.length === 0 && (
              <p className="dash-small dash-muted">
                Add an itinerary when the retreat program is confirmed.
              </p>
            )}
            {draft.itinerary.map((day, index) => (
              <div className="dash-itinerary-row" key={index}>
                <label className="dash-field">
                  <span>Day</span>
                  <input
                    value={day.day}
                    onChange={(e) =>
                      update(
                        "itinerary",
                        draft.itinerary.map((d, i) =>
                          i === index ? { ...d, day: e.target.value } : d,
                        ),
                      )
                    }
                    maxLength={80}
                  />
                </label>
                <label className="dash-field">
                  <span>Title</span>
                  <input
                    value={day.title}
                    onChange={(e) =>
                      update(
                        "itinerary",
                        draft.itinerary.map((d, i) =>
                          i === index ? { ...d, title: e.target.value } : d,
                        ),
                      )
                    }
                    maxLength={220}
                  />
                </label>
                <button
                  type="button"
                  className="dash-icon-btn"
                  aria-label={`Remove day ${index + 1}`}
                  onClick={() =>
                    update(
                      "itinerary",
                      draft.itinerary.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
                <label className="dash-field dash-itinerary-desc">
                  <span>Description</span>
                  <textarea
                    value={day.description}
                    onChange={(e) =>
                      update(
                        "itinerary",
                        draft.itinerary.map((d, i) =>
                          i === index
                            ? { ...d, description: e.target.value }
                            : d,
                        ),
                      )
                    }
                    maxLength={3000}
                    rows={3}
                  />
                </label>
              </div>
            ))}
            <hr className="dash-divider" />
            <div className="dash-two">
              <label className="dash-field">
                <span>What is included</span>
                <textarea
                  defaultValue={draft.included.join("\n")}
                  onBlur={(e) => update("included", lines(e.target.value))}
                  rows={6}
                />
                <small>One item per line.</small>
              </label>
              <label className="dash-field">
                <span>What is not included</span>
                <textarea
                  defaultValue={draft.excluded.join("\n")}
                  onBlur={(e) => update("excluded", lines(e.target.value))}
                  rows={6}
                />
                <small>One item per line.</small>
              </label>
            </div>
            <label className="dash-field">
              <span>Experience highlights</span>
              <textarea
                defaultValue={draft.highlights.join("\n")}
                onBlur={(e) => update("highlights", lines(e.target.value))}
                rows={5}
              />
              <small>One highlight per line.</small>
            </label>
            <label className="dash-field">
              <span>Travel preparation notes</span>
              <textarea
                defaultValue={draft.travelNotes.join("\n")}
                onBlur={(e) => update("travelNotes", lines(e.target.value))}
                rows={5}
              />
              <small>
                One note per line. Avoid giving individual visa or health advice
                without verifying requirements.
              </small>
            </label>
          </>
        )}
        {section === 3 && (
          <>
            <div className="dash-notice">
              <ImagePlus
                size={15}
                style={{ verticalAlign: "middle", marginRight: 7 }}
              />
              Upload images in the Media tab, then paste the returned URL below.
              Destination inspiration should not be described as photography of
              an actual retreat.
            </div>
            <label className="dash-field">
              <span>Destination card image</span>
              <input
                value={draft.image}
                onChange={(e) => update("image", e.target.value)}
                placeholder="/gallery/ghana-2026/explore-bk7a1549.webp"
              />
              <small>
                Use a landscape photograph with a clear focal point.
              </small>
            </label>
            {draft.image && (
              <img
                className="dash-media-thumb"
                src={draft.image}
                alt="Destination card preview"
              />
            )}
            <label className="dash-field" style={{ marginTop: 24 }}>
              <span>Full-width destination hero image</span>
              <input
                value={draft.heroImage}
                onChange={(e) => update("heroImage", e.target.value)}
                placeholder="/gallery/ghana-2026/explore-bk7a1549.webp"
              />
            </label>
            <label className="dash-field">
              <span>Gallery image URLs</span>
              <textarea
                defaultValue={draft.gallery.join("\n")}
                onBlur={(e) => update("gallery", lines(e.target.value))}
                rows={7}
              />
              <small>
                One image URL per line. Use images you have permission to
                publish.
              </small>
            </label>
          </>
        )}
        {section === 4 && (
          <>
            <label className="dash-field">
              <span>Retreat availability</span>
              <select
                value={draft.status}
                onChange={(e) =>
                  update("status", e.target.value as Retreat["status"])
                }
              >
                <option value="coming_soon">Coming soon</option>
                <option value="announced">Announced · collect interest</option>
                <option value="open">Open for reservations</option>
                <option value="sold_out">Sold out · collect waitlist</option>
              </select>
            </label>
            <label className="dash-check">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => update("published", e.target.checked)}
              />
              <span>
                <strong>Publish this retreat</strong>
                <br />
                Make the destination visible in the public retreat collection.
              </span>
            </label>
            <label className="dash-check">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => update("featured", e.target.checked)}
              />
              <span>
                <strong>Feature on the homepage</strong>
                <br />
                Highlight this departure in the featured collection.
              </span>
            </label>
            <label className="dash-check">
              <input
                type="checkbox"
                checked={draft.bookingEnabled}
                onChange={(e) => update("bookingEnabled", e.target.checked)}
              />
              <span>
                <strong>Enable online reservations</strong>
                <br />
                Requires open availability, confirmed dates, complete package
                prices and terms, approved site policies, and configured
                payments.
              </span>
            </label>
            <div className="dash-alert warning" style={{ marginTop: 25 }}>
              <CircleAlert size={17} />
              <p>
                Until reservation requirements are complete, visitors can join
                the destination interest list. Publishing does not imply that
                payment processing is ready.
              </p>
            </div>
            <div className="dash-proof-row">
              <CheckCircle2 size={18} />
              <span>
                <strong>Traveler registrations stay separate</strong>Double
                occupancy is priced per person. Roommates each register and pay
                separately, then your team assigns their room.
              </span>
            </div>
          </>
        )}
        <div className="dash-form-actions">
          <button
            type="button"
            className="dash-btn secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit" className="dash-btn" disabled={working}>
            {working ? (
              <LoaderCircle size={15} className="dash-spin" />
            ) : (
              <Save size={15} />
            )}
            Save retreat
          </button>
        </div>
      </form>
    </div>
  );
}
