export function UseCaseWorkflow({ steps }: { steps: string[][] }) {
  return (
    <ol className="workflow">
      {steps.map((s, j) => <li key={s[0]}><span>0{j + 1}</span><div><strong>{s[0]}</strong><small>{s[1]}</small></div></li>)}
    </ol>
  );
}
