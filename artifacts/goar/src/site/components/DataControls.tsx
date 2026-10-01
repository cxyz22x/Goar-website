import { dataControls } from '../data/content';

export function DataControls() {
  return (
    <section className="section control" id="control">
      <div>
        <p className="eyebrow">Your accounts. Your configuration.</p>
        <h2>No Goar account required.</h2>
        <p>The supplied privacy policy describes an app with no Goar-run backend, analytics or advertising SDKs. Data sent to a service you connect is subject to that service’s policies.</p>
      </div>
      <ul>{dataControls.map(([t, d]) => <li key={t}><strong>{t}</strong>{d}</li>)}</ul>
    </section>
  );
}
