import { useState } from "react";
import "./GoarLedger.css";

const facts = [
  ["No account", "Nothing is sent to a Goar server. There isn’t one."],
  ["No telemetry", "No analytics, ads, crash phones-home, or update checkers."],
  ["Your keys", "Providers, SSH, and MCP URLs are yours. Stored on-device."],
  ["Your machines", "Sandbox on the phone, or SSH to a VPS. Separate disks."],
];

const surfaces = [
  ["01", "Chat", "The operator loop. Tools, memory, skills, and Computer live in the conversation. Composer is a pill: attach, type, send."],
  ["02", "Files & Notes", "Browse SSH or the on-device sandbox. Search, upload, zip and rar, a notes editor, a code editor. Git clone lives here."],
  ["03", "Computer", "Live VNC of a Linux desktop. SSH is only a pipe to 127.0.0.1:5901 unless you open the port. You set port, size, and password in Settings → Computer."],
  ["04", "Terminal", "Shell on the sandbox or a host you pin. Jobs on SSH keep running if the phone sleeps. The agent does not move onto the VPS."],
  ["05", "Browser", "One in-app browser the operator and the agent share. You choose search and fetch endpoints."],
  ["06", "Creative", "Stills, edits, video through providers you enable. Pollinations stills need no key. Video and edits do."],
];

const policies = [
  ["Privacy policy", "Required store URL. What stays on device, what leaves only because you sent it, how to delete data.", "/privacy.html", "Read privacy"],
  ["Terms & licence", "You are responsible for keys and hosts you attach. MIT licence. No warranty.", "/terms.html", "Read terms"],
  ["Data safety", "Mapped to the Play Data safety form: we collect nothing. Third parties are only the ones you configure.", "/data-safety.html", "Data safety"],
];

function Mark() {
  return <span className="gl-mark" aria-hidden="true"><i /><i /><i /><i /></span>;
}

export default function GoarLedger() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [night, setNight] = useState(false);
  return (
    <div className={`goar-ledger${night ? " gl-night" : ""}`}>
      <header className="gl-header">
        <a className="gl-brand" href="#top"><Mark /><span>goar</span></a>
        <div className="gl-edition">A POCKET SYSTEM <span>·</span> ANDROID / ARM64</div>
        <button className="gl-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          <span>{menuOpen ? "Close" : "Index"}</span><b>{menuOpen ? "−" : "+"}</b>
        </button>
        <nav className={menuOpen ? "gl-nav gl-nav-open" : "gl-nav"} aria-label="Page navigation">
          <a href="#surfaces" onClick={() => setMenuOpen(false)}>Surfaces <sup>06</sup></a>
          <a href="#principles" onClick={() => setMenuOpen(false)}>Principles</a>
          <a href="#release" onClick={() => setMenuOpen(false)}>Release</a>
          <button className="gl-mode" onClick={() => setNight(!night)} aria-label="Toggle color theme">{night ? "Light" : "Night"} <span>◐</span></button>
        </nav>
      </header>

      <main id="top">
        <section className="gl-opening">
          <div className="gl-open-copy">
            <p className="gl-kicker"><span>01</span> YOUR PHONE, YOUR SYSTEM</p>
            <h1>One system<br />on this <em>phone.</em></h1>
            <p className="gl-lede">Chat, files, terminal, browser, and a live desktop. No Goar account. No analytics. You bring the model keys and the machines. The agent stays on the device.</p>
            <div className="gl-actions">
              <a className="gl-action-primary" href="/contact.html">Contact &amp; Play listing <span>↗</span></a>
              <a className="gl-action-secondary" href="/privacy.html">Privacy policy <span>↗</span></a>
            </div>
            <div className="gl-open-note"><span className="gl-status-dot" /> PRIVATE BY DEFAULT <span className="gl-note-line" /> NO CLOUD ACCOUNT</div>
          </div>
          <div className="gl-device-stage">
            <div className="gl-stage-label"><span>FIG. 01</span><span>THE OPERATOR LOOP</span></div>
            <div className="gl-phone">
              <div className="gl-phone-island" />
              <div className="gl-phone-top"><span className="gl-phone-mark"><Mark /></span><b>Goar</b><span className="gl-local"><i /> local</span></div>
              <div className="gl-thread-label">TODAY <span>09:41</span></div>
              <div className="gl-message gl-user">Clone the repo, start the desktop, and show me the running app.</div>
              <div className="gl-tools"><span>computer</span><span>files</span><span>shell</span></div>
              <div className="gl-message gl-agent">Imported into <code>~/projects</code>. VNC is live on the loopback pipe. Chromium is up.</div>
              <div className="gl-message gl-agent gl-message-short">Watch is view-only. Take over when the login screen appears.</div>
              <div className="gl-composer"><span>Ask Goar</span><b>↑</b></div>
            </div>
            <div className="gl-caption">An agent that acts here,<br />not somewhere else.</div>
          </div>
          <div className="gl-vertical-tag">GOAR — FIELD GUIDE / 2025</div>
        </section>

        <section className="gl-principles" id="principles">
          <div className="gl-section-marker"><span>02</span><span>THE BOUNDARIES</span></div>
          <div className="gl-principle-intro"><h2>Nothing leaves<br />without <em>you.</em></h2><p>Local first isn’t a promise buried in settings. It’s the shape of the product.</p></div>
          <div className="gl-fact-list">
            {facts.map(([title, detail], index) => (
              <article className="gl-fact" key={title}>
                <span className="gl-fact-num">0{index + 1}</span><h3>{title}</h3><p>{detail}</p><span className="gl-fact-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="gl-surfaces" id="surfaces">
          <div className="gl-surface-head">
            <div><p className="gl-kicker"><span>03</span> ONE SESSION / SIX DESTINATIONS</p><h2>The same surfaces<br />as the <em>APK.</em></h2></div>
            <p className="gl-surface-aside">One session. Destinations do not stack. Ink and bone, never purple, never a pure white fill.</p>
          </div>
          <div className="gl-surface-table">
            <div className="gl-table-heading"><span>DESTINATION</span><span>WHAT’S INSIDE</span><span>GO TO</span></div>
            {surfaces.map(([number, title, description]) => (
              <article className="gl-surface-row" key={number}>
                <div className="gl-surface-name"><span>{number}</span><h3>{title}</h3></div><p>{description}</p><span className="gl-row-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="gl-release" id="release">
          <div className="gl-release-left">
            <p className="gl-kicker"><span>04</span> READY FOR THE STORE</p>
            <h2>Play-ready.<br /><em>F-Droid honest.</em></h2>
            <p>Package <code>app.goar</code>. Android 8+, arm64-v8a. Cloud backup is off. Legal documents ship in the APK and on this site.</p>
            <div className="gl-release-stamp"><Mark /><span>PACKAGE<br />APP.GOAR</span></div>
          </div>
          <div className="gl-policy-list">
            {policies.map(([title, detail, href, label], index) => (
              <article className="gl-policy" key={title}>
                <span className="gl-policy-no">0{index + 1}</span>
                <div><h3>{title}</h3><p>{detail}</p></div>
                <a href={href} aria-label={label}>{label}<span>↗</span></a>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="gl-footer">
        <a className="gl-brand" href="#top"><Mark /><span>goar</span></a>
        <p>Your tools. Your keys. Your device.</p>
        <div><a href="/contact.html">Contact</a><span>© GOAR</span></div>
      </footer>
    </div>
  );
}