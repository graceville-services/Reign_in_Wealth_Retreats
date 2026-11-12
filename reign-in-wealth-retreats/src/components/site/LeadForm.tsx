"use client";
import { useState } from "react";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
export function LeadForm({
  destination = "all",
  title,
  compact = false,
}: {
  destination?: string;
  title?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const f = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name") || "",
          email: f.get("email"),
          destination: f.get("destination") || destination,
          source: destination === "all" ? "newsletter" : "waitlist",
          consent: f.get("consent") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "We could not save your interest. Please try again.",
        );
      trackEvent("generate_lead", {
        destination: String(f.get("destination") || destination),
        source: destination === "all" ? "newsletter" : "waitlist",
      });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      setStatus("error");
    }
  }
  if (status === "done")
    return (
      <div className="form-success" role="status">
        <span className="success-icon">
          <Check size={24} />
        </span>
        <h3>You’re on the list.</h3>
        <p>
          Your interest has been registered. We look forward to sharing the next
          chapter with you.
        </p>
        <Link href="/retreats" className="text-link">
          Explore our destinations <ArrowUpRight size={15} />
        </Link>
      </div>
    );
  return (
    <form
      className={`public-form lead-form ${compact ? "compact-form" : ""}`}
      onSubmit={submit}
    >
      {title && <h3>{title}</h3>}
      <div className="form-row">
        <label>
          Full name
          <input
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            maxLength={100}
          />
        </label>
        <label>
          Email address <span aria-hidden="true">*</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={200}
          />
        </label>
      </div>
      {destination === "all" && (
        <label>
          Where would you love to go?
          <select name="destination" defaultValue="all">
            <option value="all">Everywhere — keep me inspired</option>
            <option value="dubai-2026">Dubai · December 2026</option>
            <option value="ghana-2027">Ghana · August 2027</option>
            <option value="zanzibar-2027">Zanzibar · September 2027</option>
            <option value="dominican-republic">
              Dominican Republic · coming soon
            </option>
          </select>
        </label>
      )}
      <label className="check-label">
        <input type="checkbox" name="consent" required />
        <span>
          I would like to receive retreat news and updates about my selected
          destinations. I can unsubscribe at any time.{" "}
          <Link href="/privacy">Privacy policy</Link>.
        </span>
      </label>
      {status === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button-primary"
        type="submit"
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <>
            <LoaderCircle className="spin" size={16} />
            Saving your interest
          </>
        ) : (
          <>
            {" "}
            {destination === "all"
              ? "Join our global community"
              : "Keep me in the know"}{" "}
            <ArrowUpRight size={17} />
          </>
        )}
      </button>
      <p className="form-footnote">
        {destination === "all"
          ? "Meaningful updates, thoughtfully shared."
          : "Joining the list is free and does not reserve a place or require a payment."}
      </p>
    </form>
  );
}
