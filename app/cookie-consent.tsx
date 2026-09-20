'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const COOKIE_NAME = 'merch_cookie_preferences';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!document.cookie.split('; ').some((item) => item.startsWith(`${COOKIE_NAME}=`)));
    const reopen = () => setVisible(true);
    window.addEventListener('merch-open-cookie-settings', reopen);
    return () => window.removeEventListener('merch-open-cookie-settings', reopen);
  }, []);

  function acceptNecessary() {
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `${COOKIE_NAME}=necessary; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="cookie-banner" aria-label="Cookie notice">
      <div>
        <strong>Cookies & browser storage</strong>
        <p>
          We use necessary browser storage for your cart, account session and this cookie choice.
          Advertising and behavioural analytics cookies are not currently enabled.
        </p>
        <Link href="/legal#cookies">Cookie policy</Link>
      </div>
      <button type="button" className="primary" onClick={acceptNecessary}>Accept necessary</button>
    </aside>
  );
}
