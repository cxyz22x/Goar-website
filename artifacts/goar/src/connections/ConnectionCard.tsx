import { Link } from 'wouter';
import { useState } from 'react';
import { type ConnectedService, serviceUrl } from './services';

export function ConnectionCard({ service }: { service: ConnectedService }) {
  const [copyStatus, setCopyStatus] = useState('');
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(serviceUrl(service.path), window.location.origin).href);
      setCopyStatus('Link copied');
    } catch {
      setCopyStatus('Copy was unavailable. Select the link below to copy it manually.');
    }
  }
  const label = `Open ${service.name.toLowerCase()}`;
  return (
    <article className="connection-card" data-testid={`connection-${service.id}`}>
      <h2>{service.name}</h2>
      <p>{service.description}</p>
      <p className="note">{service.requirements}</p>
      <div className="connection-actions">
        {service.externalDocument
          ? <a className="button" href={serviceUrl(service.path)}>{label}</a>
          : <Link className="button" href={service.path}>{label}</Link>}
        <button className="connection-copy" type="button" onClick={copyLink}>Copy service link</button>
      </div>
      <a className="connection-url" href={serviceUrl(service.path)}>{serviceUrl(service.path)}</a>
      <p className="note" role="status">{copyStatus}</p>
    </article>
  );
}