import { useRef, useState } from 'react';
import { Link } from 'wouter';
import { Layout } from './Layout';

const cases = [
  { id: 'build', tab: 'Build an app', eye: 'For developers and personal projects', h: 'Make a change without returning to your desk.',
    p: 'Open your project, edit files and compile an Android app on your phone. For work that needs more resources, connect to your own SSH host and run the build there.',
    n: 'Build compatibility depends on your project, toolchain and available device resources.',
    s: [['Open and edit', 'Use Files, the code editor and Terminal.'], ['Build where it makes sense', 'Use the local sandbox or an external machine you configure.'], ['Keep the output with your project', 'Access the compiled APK from Files.']] },
  { id: 'market', tab: 'Reach customers', eye: 'For shops, freelancers and marketing teams', h: 'Prepare customer outreach in the same workspace.',
    p: 'Manage an audience and email campaign through your SMTP server. Use your Twilio account for SMS, or your Telegram bot for channel posts and messages.',
    n: 'Sending requires configured services. Account fees, consent requirements and provider limits still apply.',
    s: [['Choose the audience', 'Use your email audience and campaign tools.'], ['Prepare the message', 'Work on the copy in chat before using a sending tool.'], ['Use your own channels', 'Email through SMTP, SMS through Twilio, or posts through Telegram.']] },
  { id: 'pay', tab: 'Manage payments', eye: 'For service businesses and operations teams', h: 'Set up repeatable payment tasks.',
    p: 'Goar includes Stripe and PayPal tools for charging and payouts. Connect your accounts and configure the payment work you want the agent to carry out.',
    n: 'Use payment automation only with appropriate authorisation. Provider fees, eligibility and transaction rules apply.',
    s: [['Connect the payment service', 'Use your own Stripe or PayPal account.'], ['Define the task', 'Specify the intended charge or payout and its conditions.'], ['Check the result', 'Verify transactions in your payment provider’s records.']] },
  { id: 'team', tab: 'Work with a team', eye: 'For agencies and company teams', h: 'Share the workspace behind the work.',
    p: 'Share workspaces, import profiles from another app installation and use skills as repeatable instructions. Connect the external tools your team already uses through MCP.',
    n: 'Review company security requirements before sharing profiles, workspace data or connecting accounts.',
    s: [['Bring in a profile', 'Import an existing setup rather than starting again.'], ['Share the work', 'Use workspace sharing and playbooks for common tasks.'], ['Connect your services', 'Add MCP tools or use Telegram for team messages.']] },
];

export default function Home() {
  const [sel, setSel] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (i: number) => { setSel(i); refs.current[i]?.focus(); };
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = cases.length;
    const t = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (t >= 0) { e.preventDefault(); go(t); }
  };
  return (
    <Layout>
      <section className="hero">
        <div>
          <p className="eyebrow">An AI workspace for Android</p>
          <h1>Build, market and manage. <em>From your phone.</em></h1>
          <p className="lead">Compile an APK. Prepare an email campaign. Set up a payment workflow. Work on your device or connect to your own external services.</p>
          <div className="cta">
            <a className="btn" href="#uses" data-testid="link-explore">Explore the workflows</a>
            <Link className="btn ghost" href="/launch" data-testid="link-launch-hero">Try the browser demo</Link>
          </div>
          <p className="note">Bring your own AI providers and service accounts.</p>
        </div>
        <div className="demo dk" role="img" aria-label="Illustrative app build workflow">
          <div className="dhead"><span>APP BUILD</span><span>Illustrative workflow</span></div>
          <p className="prompt">“Build the Android project and save the APK to Files.”</p>
          <ol className="steps">
            {['Open the project', 'Run the configured build tools', 'Check the build output', 'Save the APK'].map((t, i) => <li key={t}><b>0{i + 1}</b>{t}</li>)}
          </ol>
          <div className="bar" aria-hidden="true" />
          <div className="dhead"><span>Local sandbox or your SSH host</span></div>
        </div>
      </section>

      <section className="sec" id="uses">
        <div className="shead"><h2>Choose the work you need to do.</h2><p>Examples of how Goar’s tools can fit into a personal project, a small business or a team.</p></div>
        <div className="tabs" role="tablist" aria-label="Use cases">
          {cases.map((c, i) => (
            <button key={c.id} ref={(el) => { refs.current[i] = el; }} className="tab" role="tab" id={`tab-${c.id}`} aria-selected={sel === i} aria-controls={c.id} tabIndex={sel === i ? 0 : -1} onClick={() => setSel(i)} onKeyDown={(e) => onKey(e, i)} data-testid={`tab-${c.id}`}>{c.tab}</button>
          ))}
        </div>
        {cases.map((c, i) => (
          <div key={c.id} className="case" id={c.id} role="tabpanel" aria-labelledby={`tab-${c.id}`} hidden={sel !== i}>
            <div><p className="eyebrow">{c.eye}</p><h3>{c.h}</h3><p>{c.p}</p><p className="note">{c.n}</p></div>
            <ol className="flow">{c.s.map((s, j) => <li key={s[0]}><span>0{j + 1}</span><div><strong>{s[0]}</strong><small>{s[1]}</small></div></li>)}</ol>
          </div>
        ))}
      </section>

      <section className="sec split" id="android">
        <div>
          <p className="eyebrow">The Android app</p>
          <h2>Continue the work. Keep a copy.</h2>
          <p>Your files, conversations and settings stay accessible on your phone. Data controls provide exports, imports and backups for moving or restoring your setup.</p>
          <p>Keep backup copies outside the device as well. A backup stored only on a lost or damaged phone cannot protect you from losing that phone.</p>
        </div>
        <dl>
          {[['Scheduled work', 'Tasks, Watchtower and overnight runs let you configure recurring work. Local execution depends on Android background settings and device availability.'], ['Memory and skills', 'Keep notes across chats and give the agent playbooks to follow.'], ['Browser and desktop', 'Use the in-app browser or connect to a Linux desktop through VNC over SSH.'], ['Images and video', 'Use the providers you configure for creative work, alongside your project files and conversations.']].map(([t, d]) => <div className="fe" key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
        </dl>
      </section>

      <section className="sec dk split" id="browser">
        <div>
          <p className="eyebrow">Browser demo</p>
          <h2>Look around before you install.</h2>
          <p>Try the supplied demo in your browser. It is not Goar and does not represent the full Android product. The demo starts only when you choose to open it.</p>
          <div className="cta"><Link className="btn lime" href="/launch" data-testid="link-launch-browser">Read before opening</Link></div>
        </div>
        <div>
          <p className="m" style={{ marginBottom: 6 }}>Tested demo controls</p>
          <div className="tools">{['Chat', 'Terminal', 'Provider settings', 'Slash commands', 'Connectors panel'].map((t) => <span key={t}>{t}</span>)}</div>
          <p className="note" style={{ marginTop: 16 }}>The local terminal supports a limited set of commands. Other panels present in the supplied file were not accessible through the tested navigation.</p>
          <p className="note" style={{ marginTop: 26 }}>Goar’s marketing tools, payment automation and team workspaces are Android product capabilities—not promises about this demo.</p>
        </div>
      </section>

      <section className="sec split limeband" id="control">
        <div>
          <p className="eyebrow">Your accounts. Your configuration.</p>
          <h2>No Goar account required.</h2>
          <p>The supplied privacy policy describes an app with no Goar-run backend, analytics or advertising SDKs. Data sent to a service you connect is subject to that service’s policies.</p>
        </div>
        <ul className="plain">
          <li><strong>Choose the AI provider</strong>Configure the keys and endpoints used for chat.</li>
          <li><strong>Choose where commands run</strong>Use the on-device sandbox or SSH hosts you connect.</li>
          <li><strong>Control exports and backups</strong>Use Data settings to export, import and back up your setup. This is separate from Android cloud backup, which the supplied policy says is disabled.</li>
        </ul>
      </section>

      <section className="sec split" id="get">
        <div>
          <p className="eyebrow">Android · arm64</p>
          <h2>Start with the work you need done.</h2>
          <p>Configure the services for that task, keep the workflow small, and extend it as you need.</p>
        </div>
        <div className="avail">
          <h3>Download link to be added</h3>
          <p style={{ color: 'var(--mut)' }}>No APK or verified store link has been supplied yet. The app’s original site lists Android 8+ and arm64-v8a compatibility.</p>
          <a className="ul" href="mailto:hello@goar.app" data-testid="link-mailto">Contact: hello@goar.app</a>
        </div>
      </section>
    </Layout>
  );
}
