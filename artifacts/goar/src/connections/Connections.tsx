import { Layout } from '@/site/Layout';
import { ConnectionCard } from './ConnectionCard';
import { AppConnectionInstructions } from './AppConnectionInstructions';
import { services } from './services';
import './connections.css';

export default function Connections() {
  return (
    <Layout>
      <section className="page connections-page">
        <p className="eyebrow">Connected services</p>
        <h1>Open a service.</h1>
        <p className="intro">Use the online agent, media and games from this website or open their links in your app. The main Goar page describes the Android product; these are connected browser services.</p>
        <div className="connection-grid">{services.map(service => <ConnectionCard key={service.id} service={service} />)}</div>
        <AppConnectionInstructions />
      </section>
    </Layout>
  );
}