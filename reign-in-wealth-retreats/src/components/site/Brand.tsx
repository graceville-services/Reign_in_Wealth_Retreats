import Link from "next/link";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Reign in Wealth Retreats home"
      className={`brand ${light ? "brand-light" : ""}`}
    >
      <span className="brand-image">
        <img
          src="/images/reign-in-wealth-logo.png"
          alt="Reign in Wealth Retreats"
          width="2048"
          height="1024"
        />
      </span>
      <span className="brand-subtitle">RETREATS</span>
    </Link>
  );
}
