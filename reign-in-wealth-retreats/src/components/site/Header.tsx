"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X, UserRound, ChevronDown } from "lucide-react";
import { Brand } from "./Brand";
const links = [
  { href: "/retreats", label: "Our retreats" },
  { href: "/experience", label: "The experience" },
  { href: "/about", label: "Our story" },
  { href: "/journal", label: "Travel journal" },
];
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  if (path.startsWith("/admin"))
    return (
      <header className="site-header admin-site-header">
        <div className="nav-wrap">
          <Brand />
          <Link className="text-link" href="/">
            Back to website <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
    );
  return (
    <>
      <div className="announcement-bar">
        <span>Travel with purpose. Return with possibility.</span>
        <Link href="/about">
          A brand by The Millionaire Chick <ArrowUpRight size={12} />
        </Link>
      </div>
      <header className="site-header">
        <div className="nav-wrap">
          <Brand />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={path.startsWith(l.href) ? "page" : undefined}
              >
                {l.label}
                {l.href === "/retreats" && <ChevronDown size={12} />}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <Link
              href="/portal"
              className="portal-link"
              aria-label="Traveler portal"
            >
              <UserRound size={18} />
              <span>My journey</span>
            </Link>
            <Link href="/retreats" className="button button-primary nav-cta">
              Find your retreat <ArrowUpRight size={15} />
            </Link>
            <button
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="menu-button"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <Link href="/contact">
              Talk to our team
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/portal">
              My traveler portal
              <UserRound size={18} />
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
