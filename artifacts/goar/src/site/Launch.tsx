import { Link } from 'wouter';
import { Layout, RUNTIME } from './Layout';

export default function Launch() {
  return (
    <Layout>
      <section className="page">
        <p className="eyebrow">Browser demo · Not the Goar app</p>
        <h1 style={{ fontSize: 'clamp(40px,6vw,76px)' }}>Before you open it.</h1>
        <p className="lead">This is a demo you can try in your browser, not Goar itself. It starts only when you open the link below.</p>
        <div className="box" style={{ margin: '30px 0' }}>
          <h3>What to expect</h3>
          <ul className="plain" style={{ marginTop: 14 }}>
            <li><strong>What was tested</strong>Chat, provider settings, theme persistence, slash commands, the connectors panel and limited local Terminal commands. Files, Browser, Computer, Creative and Toolkit markup exists in the supplied file, but those panels were not accessible through the tested navigation.</li>
            <li><strong>Known limitations</strong>The default SSH connection failed in testing. The History picker did not close with Escape or an outside click; reloading the page recovered navigation.</li>
            <li><strong>Not the Android product</strong>Goar’s marketing, payment automation and team features are not verified capabilities of this demo.</li>
            <li><strong>Network and storage</strong>The app loads Google Fonts and requests models from its default or configured AI provider. Its default connection relay is a third-party Wisp server. Browser persistence was not verified; keep independent copies of important work. See the <Link className="ul" href="/privacy.html">privacy policy</Link>.</li>
          <li><strong>External services</strong>Providers, SSH hosts and computer features only work once you configure external services. No free token allowance is guaranteed.</li></ul>
        </div>
        <div className="cta">
          <a className="btn" href={RUNTIME} data-testid="link-open-runtime">Open the browser demo</a>
          <Link className="btn ghost" href="/" data-testid="link-back">Back to overview</Link>
        </div>
      </section>
    </Layout>
  );
}
