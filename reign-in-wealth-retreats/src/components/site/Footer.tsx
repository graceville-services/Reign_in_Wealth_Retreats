"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Instagram,
  Facebook,
  Youtube,
  Globe2,
} from "lucide-react";
import { Brand } from "./Brand";
import type { SiteSettings } from "@/lib/types";
export function Footer({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <p className="eyebrow light">THE WORLD IS CALLING</p>
            <h2>
              Your next chapter
              <br />
              starts <em>somewhere new.</em>
            </h2>
          </div>
          <Link className="button button-cream" href="/retreats">
            Explore our retreats <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="footer-main">
          <div className="footer-brand">
            <Brand light />
            <p>
              Extraordinary places.
              <br />
              Meaningful connections.
              <br />A world of possibility.
            </p>
            <p className="parent-brand">A brand by The Millionaire Chick</p>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/retreats">Our retreats</Link>
            <Link href="/experience">The experience</Link>
            <Link href="/about">Meet our founder</Link>
            <Link href="/journal">Travel journal</Link>
            <Link href="/gallery">Photo gallery</Link>
            <Link href="/testimonials">Traveler stories</Link>
          </div>
          <div>
            <h3>Your journey</h3>
            <Link href="/reserve">Register your interest</Link>
            <Link href="/portal">Traveler portal</Link>
            <Link href="/faq">Frequently asked questions</Link>
            <Link href="/contact">Contact our team</Link>
            <Link href="/community">Join the community</Link>
          </div>
          <div>
            <h3>Stay connected</h3>
            <p>
              A little inspiration for your
              <br />
              next great experience.
            </p>
            <Link className="footer-newsletter" href="/community">
              Get retreat updates <ArrowUpRight size={15} />
            </Link>
            <div className="social-links">
              {settings.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram size={19} />
                </a>
              )}
              {settings.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <Facebook size={19} />
                </a>
              )}
              {settings.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  <Youtube size={21} />
                </a>
              )}
              {settings.tiktok && (
                <a
                  href={settings.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                >
                  <Globe2 size={19} />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Reign in Wealth Retreats. All rights
            reserved.
          </span>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Booking terms</Link>
            <Link href="/cancellation">Cancellation policy</Link>
            <Link href="/admin">Team access</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
