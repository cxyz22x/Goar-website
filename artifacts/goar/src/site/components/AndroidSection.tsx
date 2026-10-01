import { androidFeatures } from '../data/content';

export function AndroidSection() {
  return (
    <section className="section support" id="android">
      <div>
        <p className="eyebrow">Keep the project with you</p>
        <h2>Continue the work. Keep a copy.</h2>
        <p>Your files, conversations and settings stay accessible on your phone. Data controls provide exports, imports and backups for moving or restoring your setup.</p>
        <p>Keep backup copies outside the device as well. A backup stored only on a lost or damaged phone cannot protect you from losing that phone.</p>
      </div>
      <dl>
        {androidFeatures.map(([t, d]) => <div className="feature" key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
      </dl>
    </section>
  );
}
