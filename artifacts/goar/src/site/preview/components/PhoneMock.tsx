import { phoneMessages } from '../data/content';

export function PhoneMock() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-screen">
        <div className="phone-top">
          <span className="brand-mark" style={{ width: 18, height: 18 }} />
          Goar
          <span>local</span>
        </div>
        <div className="phone-body">
          {phoneMessages.map((m, i) => (
            <div key={i} className={`msg ${m.who}`}>
              {'tool' in m && <div className="tool">{m.tool}</div>}
              {m.text}
            </div>
          ))}
        </div>
        <div className="composer">Ask Goar<span></span><b>↑</b></div>
      </div>
    </div>
  );
}
