import { Link } from 'wouter';
import legal from '@/data/legal.json';
import { PrivacyScope } from './PrivacyScope';

type Doc = { slug: string; title: string; html: string };

export function LegalDocument({ slug }: { slug: string }) {
  const doc = (legal as Doc[]).find((d) => d.slug.replace(/\.html$/, '') === slug);
  return (
    <article className="section page legal">
      {slug === 'privacy' && <PrivacyScope />}
      {doc ? <div dangerouslySetInnerHTML={{ __html: doc.html }} /> : (
        <div><h1>Document unavailable</h1><p>This document could not be found. <Link href="/contact.html">Contact us</Link>.</p></div>
      )}
    </article>
  );
}
