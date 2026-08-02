export default function Lilibeth({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      {/* symmetric butterfly-angel wings, behind the shoulders */}
      <path d="M18,62 Q2,48 14,38 Q28,32 32,48 Z" fill="#f0abfc" />
      <path d="M82,62 Q98,48 86,38 Q72,32 68,48 Z" fill="#f0abfc" />
      {/* fuzzy purple sweater body */}
      <rect x={28} y={56} width={44} height={34} rx={14} fill="#a21caf" />
      <line x1={30} y1={84} x2={70} y2={84} stroke="#e11d9b" strokeWidth={3} />
      {/* fluffy cheeks */}
      <circle cx={30} cy={38} r={12} fill="#f0c17a" />
      <circle cx={70} cy={38} r={12} fill="#f0c17a" />
      {/* head */}
      <circle cx={50} cy={40} r={22} fill="#f7d49a" />
      {/* pointed pom ears */}
      <path d="M32,22 L40,30 L28,32 Z" fill="#e8b04b" />
      <path d="M68,22 L60,30 L72,32 Z" fill="#e8b04b" />
      {/* one raised brow for the smug look */}
      <line x1={38} y1={33} x2={47} y2={31.5} stroke="#3f3f46" strokeWidth={2} strokeLinecap="round" />
      {/* confident half-lidded eyes: flat, drowsy lids read smug rather than a happy squint */}
      <path d="M39,40.5 q4,-1.5 9,0" stroke="#3f3f46" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <path d="M61,40.5 q-4,-1.5 -9,0" stroke="#3f3f46" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {/* smirk */}
      <path d="M44,50 Q50,54 58,48" stroke="#3f3f46" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {/* sparkle */}
      <path d="M84,20 l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2 Z" fill="#fbbf24" />
    </svg>
  );
}
