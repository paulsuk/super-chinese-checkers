import type { JSX } from "react";
import Mia from "./Mia";
import June from "./June";
import Lilibeth from "./Lilibeth";

const REGISTRY: Record<string, (p: { size?: number }) => JSX.Element> = {
  mia: Mia,
  june: June,
  lilibeth: Lilibeth,
};

export function Avatar({ id, size = 48 }: { id: string; size?: number }) {
  const Found = REGISTRY[id];
  if (Found) return <Found size={size} />;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx={50} cy={50} r={45} fill="#525252" />
    </svg>
  );
}
