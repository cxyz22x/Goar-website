import { Layout } from './Layout';
import { LegalDocument } from './components/LegalDocument';

export default function Legal({ slug }: { slug: string }) {
  return <Layout><LegalDocument slug={slug} /></Layout>;
}
