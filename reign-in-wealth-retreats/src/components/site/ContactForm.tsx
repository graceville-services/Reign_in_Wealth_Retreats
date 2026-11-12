"use client";
import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
export function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setStatus("loading");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          subject: f.get("subject"),
          message: f.get("message"),
          consent: f.get("consent") === "on",
          website: f.get("website"),
        }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error || "Unable to submit. Please try again.");
      trackEvent("contact_request", {
        source:
          f.get("subject") === "partnership"
            ? "partnership"
            : f.get("subject") === "group"
              ? "group"
              : "general",
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
          <Check />
        </span>
        <h3>
          Your next chapter
          <br />
          is a conversation away.
        </h3>
        <p>Thank you. Your inquiry has been received by our team.</p>
        <button className="text-link" onClick={() => setStatus("idle")}>
          Send another inquiry <ArrowUpRight size={15} />
        </button>
      </div>
    );
  return (
    <form className="public-form" onSubmit={submit}>
      <div className="form-row">
        <label>
          Your name *
          <input
            name="name"
            autoComplete="name"
            placeholder="Full name"
            required
            maxLength={100}
          />
        </label>
        <label>
          Email address *
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
      <div className="form-row">
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Include country code"
            maxLength={40}
          />
        </label>
        <label>
          What can we help with?
          <select name="subject">
            <option value="general">A retreat or general question</option>
            <option value="group">Group travel</option>
            <option value="partnership">Partnership or sponsorship</option>
          </select>
        </label>
      </div>
      <label>
        Your message *
        <textarea
          name="message"
          placeholder="Tell us what you have in mind, and which destination is calling you."
          rows={6}
          required
          minLength={10}
          maxLength={5000}
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave this field empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="check-label">
        <input type="checkbox" name="consent" required />
        <span>
          I agree to the use of my details to respond to this inquiry as
          explained in the <Link href="/privacy">privacy policy</Link>.
        </span>
      </label>
      {status === "error" && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="button button-primary"
      >
        {status === "loading" ? (
          <>
            <LoaderCircle size={16} className="spin" />
            Sending your inquiry
          </>
        ) : (
          <>
            Let’s start a conversation <ArrowUpRight size={17} />
          </>
        )}
      </button>
    </form>
  );
}
