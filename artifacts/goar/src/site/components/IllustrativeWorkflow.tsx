import { buildSteps } from '../data/content';

export function IllustrativeWorkflow() {
  return (
    <div className="demo" role="group" aria-label="Illustrative app build workflow">
      <div className="demo-head"><span>APP BUILD</span><span>Illustrative workflow</span></div>
      <p className="prompt">“Build the Android project and save the APK to Files.”</p>
      <ol className="steps">
        {buildSteps.map((t, i) => <li key={t}><span className="step-num">0{i + 1}</span>{t}</li>)}
      </ol>
      <div className="progress" aria-hidden="true" />
      <div className="demo-head"><span>Local sandbox or your SSH host</span></div>
    </div>
  );
}
