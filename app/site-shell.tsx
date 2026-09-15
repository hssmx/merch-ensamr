'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, ArrowUpRight, Camera, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
const navigation = [
  ['/collection', 'Shop collection'],
  ['/design-studio', 'Print your design'],
  ['/made-for-you', 'Design services'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];
function Brand() {
  return (
    <span className="brand-lockup">
      <strong>MERCH</strong>
      <i>ENSAM-R</i>
    </span>
  );
}
export function SiteHeader() {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const next = window.scrollY;
      setHidden(next > 140 && next > last + 7);
      if (next < last - 7) setHidden(false);
      last = next;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        FIRST EDITION · DESIGNED AT ENSAM RABAT · NEW DROPS IN PROGRESS
      </div>
      <header className={`shop-header ${hidden ? 'header-hidden' : ''}`}>
        <div className="header-main">
          <div className="header-left">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={23} />
            </button>
            <a
              className="header-instagram"
              href="https://www.instagram.com/merch.ensamr/"
              target="_blank"
              rel="noreferrer"
            >
              <Camera size={18} />
              <span>@merch.ensamr</span>
            </a>
          </div>
          <Link
            className="shop-brand"
            href="/"
            aria-label="ENSAM merch shop home"
          >
            <Brand />
          </Link>
          <Link className="header-contact" href="/contact">
            <Phone size={19} />
            <span>
              Order by WhatsApp
              <small>Talk directly with the team</small>
            </span>
          </Link>
        </div>
        <nav className="desktop-navigation" aria-label="Main navigation">
          {navigation.map(([url, name]) => (
            <Link
              key={url}
              href={url}
              aria-current={path.startsWith(url) ? 'page' : undefined}
            >
              {name}
            </Link>
          ))}
        </nav>
      </header>
      <Dialog open={menu} onOpenChange={setMenu}>
        <DialogContent className="nav-dialog">
          <DialogTitle>The ENSAM Merch Shop</DialogTitle>
          <DialogDescription>
            Collection, printing and design services.
          </DialogDescription>
          <nav aria-label="Mobile navigation">
            {[['/', 'Home'], ...navigation].map(([url, name]) => (
              <Link key={url} href={url} onClick={() => setMenu(false)}>
                {name}
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </nav>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function SiteFooter() {
  return (
    <footer className="shop-footer">
      <div className="footer-statement">
        <Link
          className="footer-monogram"
          href="/"
          aria-label="MERCH ENSAM-R home"
        >
          <strong>MERCH</strong>
          <span>ENSAM-R</span>
        </Link>
        <div>
          <span>THE LABEL FROM ENSAM RABAT</span>
          <h2>
            Wear the idea.
            <br />
            Carry the story.
          </h2>
          <Link href="/collection">
            Explore the collection <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      <div className="footer-grid">
        <div>
          <h2>Explore</h2>
          <Link href="/collection">Shop collection</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/about">About us</Link>
        </div>
        <div>
          <h2>Create</h2>
          <Link href="/design-studio">Print your design</Link>
          <Link href="/made-for-you">Design services</Link>
          <Link href="/contact">Contact our team</Link>
        </div>
        <div>
          <h2>Follow</h2>
          <a
            href="https://www.instagram.com/merch.ensamr/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram <ArrowUpRight size={14} />
          </a>
          <Link href="/contact">WhatsApp ordering</Link>
        </div>
        <div className="footer-note">
          <span>STUDENT-LED · COMMUNITY-MADE</span>
          <p>Created by the Media Committee for ENSAM Rabat.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MERCH ENSAM-R</span>
        <span>RABAT · MOROCCO</span>
        <a href="#main">BACK TO TOP ↑</a>
      </div>
    </footer>
  );
}
