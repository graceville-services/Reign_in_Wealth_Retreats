"use client";
import { useState, type FormEvent } from "react";
import { CircleAlert, LoaderCircle, Save } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { api, json } from "./api";
export default function SettingsEditor({
  settings,
  onSaved,
}: {
  settings: SiteSettings;
  onSaved: (settings: SiteSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [section, setSection] = useState("Brand & contact");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const update = <K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K],
  ) => {
    setDraft((s) => ({ ...s, [key]: value }));
    setSuccess("");
  };
  const field = (
    key: keyof Omit<SiteSettings, "policiesApproved">,
    label: string,
    type = "text",
    help = "",
  ) => (
    <label className="dash-field">
      <span>{label}</span>
      <input
        type={type}
        value={String(draft[key] ?? "")}
        onChange={(e) => update(key, e.target.value)}
      />
      {help && <small>{help}</small>}
    </label>
  );
  async function save(e: FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError("");
    try {
      const result = await api<SiteSettings>(
        "/api/admin/settings",
        json("PATCH", draft),
      );
      setDraft(result);
      onSaved(result);
      setSuccess("Your website settings have been saved.");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setWorking(false);
    }
  }
  return (
    <div className="dash-editor">
      <div className="dash-section-head">
        <h2>Make it your own.</h2>
      </div>
      <div className="dash-editor-nav">
        {["Brand & contact", "Social & media", "Policies & tracking"].map(
          (s) => (
            <button
              className={s === section ? "active" : ""}
              key={s}
              onClick={() => setSection(s)}
            >
              {s}
            </button>
          ),
        )}
      </div>
      {error && (
        <div className="dash-alert error" role="alert">
          <CircleAlert size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="dash-alert" role="status">
          {success}
        </div>
      )}
      <form onSubmit={save}>
        {section === "Brand & contact" && (
          <>
            {field("brandName", "Business name")}
            {field("tagline", "Brand tagline")}
            {field(
              "contactEmail",
              "Public contact email",
              "email",
              "Only a supplied email will be displayed publicly.",
            )}
            {field(
              "whatsapp",
              "WhatsApp number",
              "tel",
              "International digits only, including country code. Leave empty to hide WhatsApp.",
            )}
            {field(
              "parentBrandUrl",
              "The Millionaire Chick website",
              "url",
              "The approved parent-brand website. Leave empty if not ready.",
            )}
          </>
        )}
        {section === "Social & media" && (
          <>
            {field("instagram", "Instagram profile URL", "url")}
            {field("facebook", "Facebook page URL", "url")}
            {field("tiktok", "TikTok profile URL", "url")}
            {field("youtube", "YouTube channel URL", "url")}
            <hr className="dash-divider" />
            {field(
              "founderImage",
              "Founder photograph URL",
              "text",
              "Upload a confirmed photo of Kimona Hanson in Media, then paste its returned URL.",
            )}
            {field(
              "heroVideo",
              "Homepage hero video URL",
              "text",
              "Optional MP4 or WebM. Leave empty to use the destination photograph.",
            )}
          </>
        )}
        {section === "Policies & tracking" && (
          <>
            <div className="dash-notice">
              Review and approve your business policies before accepting paid
              reservations. Text entered here is published on the corresponding
              policy pages.
            </div>
            {(
              ["privacyPolicy", "bookingTerms", "cancellationPolicy"] as const
            ).map((key, i) => (
              <label className="dash-field" key={key}>
                <span>
                  {
                    [
                      "Privacy policy",
                      "Booking terms",
                      "Cancellation and refund policy",
                    ][i]
                  }
                </span>
                <textarea
                  rows={10}
                  value={draft[key]}
                  onChange={(e) => update(key, e.target.value)}
                  maxLength={20000}
                />
              </label>
            ))}
            <label className="dash-check">
              <input
                type="checkbox"
                checked={draft.policiesApproved}
                onChange={(e) => update("policiesApproved", e.target.checked)}
              />
              <span>
                I have reviewed these policies for this business and approve
                them for publication and use in paid bookings.
              </span>
            </label>
            <hr className="dash-divider" />
            {field(
              "analyticsId",
              "Google Analytics measurement ID",
              "text",
              "Optional, for example G-XXXXXXXXXX. Non-essential analytics should respect the visitor’s consent choice.",
            )}
          </>
        )}
        <div className="dash-form-actions">
          <button className="dash-btn" disabled={working}>
            {working ? (
              <LoaderCircle size={15} className="dash-spin" />
            ) : (
              <Save size={15} />
            )}
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
