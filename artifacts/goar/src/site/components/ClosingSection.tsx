import { Availability } from './Availability';

export function ClosingSection() {
  return (
    <section className="section closing" id="get">
      <div>
        <p className="eyebrow">Android · arm64</p>
        <h2>Start with the work you need done.</h2>
        <p>Configure the services for that task, keep the workflow small, and extend it as you need.</p>
      </div>
      <Availability />
    </section>
  );
}
