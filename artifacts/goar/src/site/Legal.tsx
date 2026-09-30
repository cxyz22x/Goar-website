import { Link } from 'wouter';
import { Layout } from './Layout';
import legal from '@/data/legal.json';

type Doc = { slug: string; title: string; html: string };

export default function Legal({ slug }: { slug: string }) {
  const doc = (legal as Doc[]).find((d) => d.slug.replace(/\.html$/, '') === slug);
  return (
    <Layout>
      <article className="page legal">
        {slug === 'privacy' && (
          <aside className="callout" data-testid="note-privacy-scope">
            <h2>Website and separate browser demo</h2>
            <p><strong>This marketing site</strong> has no account system. It does not start the browser application until you follow the launch link. Website typography may be loaded from third-party font services.</p>
            <p><strong>The browser demo is not Goar.</strong> It loads Google Fonts and requests models from its default or configured AI provider. Its default connection relay is a third-party Wisp server. Browser persistence and encryption were not verified. The original policy below describes the Android app; its claims about this website’s fonts and storage do not describe this rebuilt site or the separate demo.</p>
          </aside>
        )}
        {doc ? <div dangerouslySetInnerHTML={{ __html: doc.html }} /> : (
          <div><h1>Document unavailable</h1><p>This document could not be found. <Link href="/contact.html" className="ul">Contact us</Link>.</p></div>
        )}
      </article>
    </Layout>
  );
}
