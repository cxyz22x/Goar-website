import { Link } from 'wouter';
import { PhoneMock } from './PhoneMock';

export function Hero() {
  return (
    <section className="wrap hero">
      <div>
        <p className="kicker">Android · arm64 · F-Droid posture</p>
        <h1>One system on this phone.</h1>
        <p className="lede">Chat, files, terminal, browser, and a live desktop. No Goar account. No analytics. You bring the model keys and the machines. The agent stays on the device.</p>
        <div className="cta-row">
          <Link className="pill solid" href="/contact.html" data-testid="link-contact">Contact &amp; Play listing</Link>
          <Link className="pill ghost" href="/privacy.html" data-testid="link-privacy-hero">Privacy policy</Link>
        </div>
      </div>
      <PhoneMock />
    </section>
  );
}
