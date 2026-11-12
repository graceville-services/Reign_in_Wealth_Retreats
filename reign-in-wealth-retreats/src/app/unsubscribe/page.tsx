"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, Mail } from "lucide-react";
function UnsubscribeContent() {
  const query = useSearchParams();
  const token = query.get("token");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  async function unsubscribe() {
    setStatus("loading");
    try {
      const r = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error || "Unable to unsubscribe. Please contact our team.",
        );
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      setStatus("error");
    }
  }
  return (
    <section className="not-found container">
      {status === "done" ? (
        <>
          <Check size={35} />
          <p className="eyebrow">YOUR PREFERENCES, RESPECTED</p>
          <h1>
            You’re <em>unsubscribed.</em>
          </h1>
          <p>
            You won’t receive retreat marketing updates.
            <br />
            Essential messages for an existing booking will still reach you.
          </p>
        </>
      ) : (
        <>
          <Mail size={35} />
          <p className="eyebrow">STAY CONNECTED, ON YOUR TERMS</p>
          <h1>
            A little less <em>in your inbox.</em>
          </h1>
          <p>
            Unsubscribe from retreat news and marketing updates.
            <br />
            Your existing registrations and booking messages are unaffected.
          </p>
          {token ? (
            <button
              className="button button-primary"
              disabled={status === "loading"}
              onClick={unsubscribe}
            >
              {status === "loading"
                ? "Updating your preferences…"
                : "Unsubscribe from retreat updates"}
            </button>
          ) : (
            <p>
              This link is missing its preference token. Use the unsubscribe
              link in your email, or contact our team.
            </p>
          )}
          {status === "error" && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
      <p>
        <Link className="text-link" href="/contact">
          Contact our team <ArrowUpRight size={16} />
        </Link>
      </p>
    </section>
  );
}
export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={<div className="page-loading">Loading your preferences…</div>}
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
