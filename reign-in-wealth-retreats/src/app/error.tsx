"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="not-found container">
      <p className="eyebrow">A BRIEF PAUSE</p>
      <h1>
        Let’s try <em>that again.</em>
      </h1>
      <p>We couldn’t load this page right now. Please try again in a moment.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
