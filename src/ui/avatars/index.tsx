import juneSrc from "../../assets/avatars/june.png";
import lilibethSrc from "../../assets/avatars/lilibeth.png";
import miaSrc from "../../assets/avatars/mia.png";

// Art is pre-cropped to a transparent circle at 192px; work\scratch\crop-avatars.ps1
// regenerates these from the full-size originals kept in work\.
const REGISTRY: Record<string, string> = {
  mia: miaSrc,
  june: juneSrc,
  lilibeth: lilibethSrc,
};

export function Avatar({ id, size = 48 }: { id: string; size?: number }) {
  const src = REGISTRY[id];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx={50} cy={50} r={45} fill="#525252" />
    </svg>
  );
}
