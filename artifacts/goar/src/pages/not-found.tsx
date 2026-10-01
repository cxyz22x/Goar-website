import { Link } from 'wouter';
import { Layout } from '@/site/Layout';

export default function NotFound() {
  return (
    <Layout>
      <section className="section page">
        <p className="eyebrow">404</p>
        <h1>Page not found.</h1>
        <p className="intro">This address does not match a page on this site. Use the links above or return to the overview.</p>
        <Link href="/" className="btn primary">Back to Goar</Link>
      </section>
    </Layout>
  );
}
