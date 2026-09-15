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
      <div className="footer-grid">
        <div>
          <Link
            className="shop-brand"
            href="/"
            aria-label="ENSAM merch shop home"
          >
            <Brand />
          </Link>
          <p>Created by the Media Committee and ADE ENSAMR for ENSAM Rabat.</p>
        </div>
        <div>
          <h2>The shop</h2>
          {navigation.map(([url, name]) => (
            <Link key={url} href={url}>
              {name}
            </Link>
          ))}
          <Link href="/#reviews">Reviews</Link>
          <Link href="/#faq">FAQ</Link>
        </div>
        <div>
          <h2>Our originals</h2>
          <Link href="/collection/mind-in-motion">Mind in Motion</Link>
          <Link href="/collection/be-creative">Be creART(et métiers)ive</Link>
          <Link href="/collection/think-beyond-limits">
            Think Beyond Limits
          </Link>
        </div>
        <div>
          <h2>Stay connected</h2>
          <a
            href="https://www.instagram.com/merch.ensamr/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram <ArrowUpRight size={14} />
          </a>
          <p>
            Ordering and payment are arranged
            <br />
            directly with our team on WhatsApp.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>MERCH ENSAM RABAT</span>
        <span>MEDIA COMMITTEE × ADE ENSAMR</span>
        <span>MAD · Morocco</span>
      </div>
    </footer>
  );
}
