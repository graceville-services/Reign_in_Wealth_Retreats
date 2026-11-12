import Link from "next/link";
import { Compass, ArrowUpRight } from "lucide-react";
export default function NotFound() {
  return (
    <section className="not-found container">
      <Compass size={42} strokeWidth={1} />
      <p className="eyebrow">A SMALL DETOUR</p>
      <h1>
        Let’s find your
        <br />
        <em>way back.</em>
      </h1>
      <p>This chapter isn’t here. A world of possibilities still is.</p>
      <Link className="button button-primary" href="/retreats">
        Explore our retreats <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
