import { Layout } from './Layout';

export default function Contact() {
  return (
    <Layout>
      <section className="page">
        <p className="eyebrow">Contact</p>
        <h1 style={{ fontSize: 'clamp(40px,6vw,76px)' }}>Write to us.</h1>
        <p className="lead">Questions about Goar, the separate browser demo or the documents on this site.</p>
        <p style={{ fontSize: 28, letterSpacing: '-.03em' }}><a className="ul" href="mailto:hello@goar.app" data-testid="link-email">hello@goar.app</a></p>
        <p className="note">Contact address carried over from the original site. No download link has been published yet.</p>
      </section>
    </Layout>
  );
}
