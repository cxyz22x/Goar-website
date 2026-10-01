import { IllustrativeWorkflow } from './IllustrativeWorkflow';

export function Hero() {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">An AI workspace for Android</p>
        <h1>Build, market and manage. From your phone.</h1>
        <p className="intro">Compile an APK. Prepare an email campaign. Set up a payment workflow. Work on your device or connect to your own external services.</p>
        <a className="button" href="#uses" data-testid="link-explore">Explore the workflows</a>
        <p className="note">Bring your own AI providers and service accounts.</p>
      </div>
      <IllustrativeWorkflow />
    </section>
  );
}
