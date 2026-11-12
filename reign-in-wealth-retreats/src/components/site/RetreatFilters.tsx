"use client";
import { useState } from "react";
import { ArrowDownWideNarrow, Search, Compass } from "lucide-react";
import type { Retreat } from "@/lib/types";
import { RetreatCard } from "./RetreatCard";
export function RetreatFilters({ retreats }: { retreats: Retreat[] }) {
  const [region, setRegion] = useState("All destinations");
  const [search, setSearch] = useState("");
  const regions = [
    "All destinations",
    ...new Set(retreats.map((r) => r.region)),
  ];
  const results = retreats.filter(
    (r) =>
      (region === "All destinations" || r.region === region) &&
      [r.destination, r.country, r.tagline]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="retreat-filter-bar">
        <div
          className="filter-chips"
          role="group"
          aria-label="Filter by region"
        >
          {regions.map((r) => (
            <button
              className={region === r ? "selected" : ""}
              key={r}
              aria-pressed={region === r}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="destination-search">
          <Search size={16} />
          <input
            aria-label="Search destinations"
            placeholder="Find your destination"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="results-label">
        <span>
          {results.length} thoughtfully curated{" "}
          {results.length === 1 ? "journey" : "journeys"}
        </span>
        <span>
          <ArrowDownWideNarrow size={14} /> Upcoming departures
        </span>
      </div>
      {results.length ? (
        <div className="retreat-grid retreat-grid-four">
          {results.map((r, i) => (
            <RetreatCard key={r.id} retreat={r} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Compass size={32} />
          <h3>A different destination in mind?</h3>
          <p>Try another search or tell our team where you would love to go.</p>
          <button
            className="button button-outline"
            onClick={() => {
              setRegion("All destinations");
              setSearch("");
            }}
          >
            Show all retreats
          </button>
        </div>
      )}
    </>
  );
}
