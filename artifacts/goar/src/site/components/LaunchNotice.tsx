import { Link } from 'wouter';

export function LaunchNotice() {
  return (
    <section className="section page">
      <p className="eyebrow">Agent · Not the Goar app</p>
      <h1>Before you open it.</h1>
      <p className="intro">The Agent is a free browser try-it service. It is not Goar itself. Nothing starts until you follow the link below.</p>
      <ul className="notice-list">
        <li><strong>Not the Android product</strong>Goar’s marketing, payment automation and team features are not verified capabilities of the Agent.</li>
        <li><strong>External services</strong>The supplied default chat and Default SSH preset connected during testing. Finish provider setup, then use Default SSH above the agent or Default and Save in its Settings. Your own hosts and providers need your configuration. Provider limits apply; free or unlimited compute is not guaranteed.</li>
        <li><strong>Privacy</strong>Read the <Link href="/privacy.html">privacy policy</Link> and keep independent copies of important work.</li>
      </ul>
      <p><Link className="button" href="/agent" data-testid="link-open-agent">Open the Agent</Link></p>
      <p className="note"><Link href="/connections">See how the services connect</Link> · <Link href="/">Back to overview</Link></p>
    </section>
  );
}
