export default function Mia({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {/* tiny body + paws */}
      <rect x={33} y={78} width={34} height={20} rx={10} fill="#a97c50" />
      <ellipse cx={40} cy={95} rx={5} ry={4} fill="#8a6642" />
      <ellipse cx={60} cy={95} rx={5} ry={4} fill="#8a6642" />
      {/* small rounded ears, peeking from behind the head */}
      <circle cx={30} cy={20} r={9} fill="#8a6642" />
      <circle cx={70} cy={20} r={9} fill="#8a6642" />
      {/* big round capybara head */}
      <circle cx={50} cy={46} r={29} fill="#a97c50" />
      {/* headphone band + pink cups */}
      <path d="M24,26 Q50,-6 76,26" stroke="#27272a" strokeWidth={6} fill="none" strokeLinecap="round" />
      <circle cx={22} cy={30} r={10} fill="#f472b6" stroke="#27272a" strokeWidth={2} />
      <circle cx={78} cy={30} r={10} fill="#f472b6" stroke="#27272a" strokeWidth={2} />
      {/* muzzle */}
      <ellipse cx={50} cy={58} rx={17} ry={13} fill="#c9a06e" />
      <ellipse cx={50} cy={48} rx={3.5} ry={2.5} fill="#3f3f46" />
      <path d="M42,60 Q50,66 58,60" stroke="#3f3f46" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* relaxed eyes */}
      <ellipse cx={39} cy={42} rx={3.2} ry={4} fill="#3f3f46" />
      <ellipse cx={61} cy={42} rx={3.2} ry={4} fill="#3f3f46" />
      <circle cx={38} cy={40} r={1} fill="#ffffff" />
      <circle cx={60} cy={40} r={1} fill="#ffffff" />
      {/* blush */}
      <circle cx={27} cy={54} r={5} fill="#f9a8d4" fillOpacity={0.7} />
      <circle cx={73} cy={54} r={5} fill="#f9a8d4" fillOpacity={0.7} />
    </svg>
  );
}
