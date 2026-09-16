'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, ArrowUpRight, Camera, Phone, X } from 'lucide-react';

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

function isDarkBackground(element: Element | null) {
  let node = element as HTMLElement | null;

  while (node && node !== document.documentElement) {
    const explicit = node.dataset.headerTheme;
    if (explicit === 'dark') return true;
    if (explicit === 'light') return false;

    const background = getComputedStyle(node).backgroundColor;
    const match = background.match(
      /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/,
    );

    if (match) {
      const alpha = match[4] === undefined ? 1 : Number(match[4]);
      if (alpha > 0.35) {
        const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance < 0.42;
      }
    }

    node = node.parentElement;
  }

  return false;
}

export function SiteHeader() {
  const path = usePathname();
  const header = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let frame = 0;

    const sync = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);

      const headerBottom = header.current?.getBoundingClientRect().bottom ?? 0;
      const sampleY = Math.min(window.innerHeight - 1, Math.max(1, headerBottom + 8));
      const beneath = document.elementFromPoint(window.innerWidth / 2, sampleY);
      setTheme(isDarkBackground(beneath) ? 'dark' : 'light');
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [path]);

  useEffect(() => {
    setMenu(false);
  }, [path]);

  useEffect(() => {
    if (!menu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButton.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menu]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        FIRST EDITION · DESIGNED AT ENSAM RABAT · NEW DROPS IN PROGRESS
      </div>
      <header
        ref={header}
        data-theme={theme}
        className={`shop-header ${scrolled ? 'header-scrolled' : ''}`}
      >
        <div className="header-main">
          <div className="header-left">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              aria-expanded={menu}
              aria-controls="site-navigation-drawer"
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

      <div
        className={`nav-drawer-backdrop ${menu ? 'open' : ''}`}
        aria-hidden="true"
        onClick={() => setMenu(false)}
      />
      <aside
        id="site-navigation-drawer"
        className={`nav-drawer ${menu ? 'open' : ''}`}
        aria-hidden={!menu}
        aria-label="Site navigation"
      >
        <div className="nav-drawer-top">
          <Link href="/" className="nav-drawer-brand" onClick={() => setMenu(false)}>
            <Brand />
          </Link>
          <button
            ref={closeButton}
            type="button"
            className="nav-drawer-close"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X size={22} />
          </button>
        </div>
        <div className="nav-drawer-copy">
          <span>MERCH ENSAM-R · EDITION 001</span>
          <p>Collection, printing and design services.</p>
        </div>
        <nav>
          {[['/', 'Home'], ...navigation].map(([url, name], index) => (
            <Link key={url} href={url} onClick={() => setMenu(false)}>
              <small>{String(index + 1).padStart(2, '0')}</small>
              <span>{name}</span>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </nav>
        <div className="nav-drawer-foot">
          <a
            href="https://www.instagram.com/merch.ensamr/"
            target="_blank"
            rel="noreferrer"
          >
            @merch.ensamr <ArrowUpRight size={14} />
          </a>
          <span>RABAT · MOROCCO</span>
        </div>
      </aside>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="shop-footer" data-header-theme="dark">
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
