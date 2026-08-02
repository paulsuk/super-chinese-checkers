export default function June({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {/* pointed ears, behind the fluff */}
      <path d="M22,26 L18,10 L34,26 Z" fill="#d99a2f" />
      <path d="M78,26 L82,10 L66,26 Z" fill="#d99a2f" />
      {/* fluffy cheek/jaw bumps */}
      <circle cx={26} cy={38} r={11} fill="#e8b04b" />
      <circle cx={74} cy={38} r={11} fill="#e8b04b" />
      <circle cx={32} cy={58} r={9} fill="#e8b04b" />
      <circle cx={68} cy={58} r={9} fill="#e8b04b" />
      {/* main fluffy head */}
      <circle cx={50} cy={42} r={25} fill="#e8b04b" />
      {/* leaf crown */}
      <path d="M50,2 L55,18 L45,18 Z" fill="#84cc16" />
      <path d="M42,6 L48,20 L38,16 Z" fill="#84cc16" />
      <path d="M58,6 L52,20 L62,16 Z" fill="#84cc16" />
      {/* small round glasses */}
      <circle cx={41} cy={43} r={6.5} fill="none" stroke="#27272a" strokeWidth={2} />
      <circle cx={59} cy={43} r={6.5} fill="none" stroke="#27272a" strokeWidth={2} />
      <line x1={47.5} y1={43} x2={52.5} y2={43} stroke="#27272a" strokeWidth={2} />
      <line x1={34.5} y1={42} x2={28} y2={39} stroke="#27272a" strokeWidth={1.5} />
      <line x1={65.5} y1={42} x2={72} y2={39} stroke="#27272a" strokeWidth={1.5} />
      {/* stern straight brows */}
      <line x1={35} y1={31} x2={47} y2={37} stroke="#3f3f46" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={65} y1={31} x2={53} y2={37} stroke="#3f3f46" strokeWidth={2.5} strokeLinecap="round" />
      {/* eyes behind the lenses */}
      <circle cx={41} cy={44} r={2} fill="#3f3f46" />
      <circle cx={59} cy={44} r={2} fill="#3f3f46" />
      {/* nose + flat stern mouth */}
      <path d="M47,50 L53,50 L50,54 Z" fill="#3f3f46" />
      <line x1={44} y1={59} x2={56} y2={59} stroke="#3f3f46" strokeWidth={2} strokeLinecap="round" />
      {/* pineapple body */}
      <ellipse cx={50} cy={82} rx={19} ry={15} fill="#facc15" />
      {/* crosshatch: endpoints hand-trimmed to sit inside the ellipse outline (no clipPath,
          so no id — this SVG can render many times at once without id collisions) */}
      <line x1={34.3} y1={89.7} x2={43.4} y2={68.4} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <line x1={40.6} y1={93.6} x2={51.4} y2={68.4} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <line x1={48} y1={95} x2={58.8} y2={69.8} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <line x1={56} y1={95} x2={64.9} y2={74.3} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <line x1={65.7} y1={89.7} x2={56.6} y2={68.4} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <line x1={59.4} y1={93.6} x2={48.6} y2={68.4} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <line x1={52} y1={95} x2={41.2} y2={69.8} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <line x1={44} y1={95} x2={35.1} y2={74.3} stroke="#ca8a04" strokeWidth={1.2} opacity={0.55} />
      <ellipse cx={50} cy={82} rx={19} ry={15} fill="none" stroke="#ca8a04" strokeWidth={2} />
    </svg>
  );
}
