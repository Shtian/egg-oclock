import type { Doneness, EggSpec, Sides, Yolk } from "../lib/order";

/*
 * Hand-drawn egg illustrations. One stroke weight and the --egg-* colours,
 * so every picture reads as one set. All are decorative: the text next to
 * them carries the meaning.
 */

const STROKE = { stroke: "var(--art-ink)", strokeWidth: 2, strokeLinejoin: "round" } as const;

type ArtProps = { size?: number };

function Svg({ size = 56, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg
      className="egg-art"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const SHELL = "M32 6C42.5 6 50 21 50 34C50 46.5 42 55 32 55C22 55 14 46.5 14 34C14 21 21.5 6 32 6Z";

/** A whole egg standing in an egg cup. */
export function EggInCup({ size }: ArtProps) {
  return (
    <Svg size={size}>
      <path
        d={SHELL}
        transform="translate(0 -2) scale(1 .92) translate(0 2)"
        fill="var(--egg-shell)"
        {...STROKE}
      />
      <path
        d="M24 13.5C26 11 28.5 9.6 31 9.3"
        fill="none"
        stroke="var(--egg-white)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M14 38H50C50 46 44 51 39 52L41 57H23L25 52C20 51 14 46 14 38Z"
        fill="var(--egg-cup)"
        {...STROKE}
      />
      <path d="M20 59H44" {...STROKE} strokeLinecap="round" />
    </Svg>
  );
}

/** A soft-, medium- or hard-boiled egg cut in half. */
export function BoiledHalf({ doneness, size }: ArtProps & { doneness: Doneness }) {
  return (
    <Svg size={size}>
      <path d={SHELL} transform="translate(0 2)" fill="var(--egg-white)" {...STROKE} />
      {doneness === "bløtkokt" && (
        <>
          <path
            d="M21 39C21 32.5 26 28 32 28C38 28 43 32.5 43 39C43 42 41.5 44.5 39.5 46.5C39 49.5 38 52.5 35.5 52.5C33.5 52.5 33.5 50 33 48.5C28 50 21 46 21 39Z"
            fill="var(--yolk-runny)"
            {...STROKE}
          />
          <ellipse cx={27.5} cy={34} rx={3} ry={2} fill="var(--egg-white)" opacity={0.7} />
        </>
      )}
      {doneness === "medium" && (
        <>
          <circle cx={32} cy={39} r={11} fill="var(--yolk)" {...STROKE} />
          <circle cx={32} cy={39.5} r={6} fill="var(--yolk-runny)" />
        </>
      )}
      {doneness === "hardkokt" && (
        <>
          <circle cx={32} cy={39} r={11} fill="var(--yolk-hard)" {...STROKE} />
          <circle
            cx={32}
            cy={39}
            r={6.5}
            fill="none"
            stroke="var(--yolk)"
            strokeWidth={1.5}
            opacity={0.6}
          />
        </>
      )}
    </Svg>
  );
}

const WHITE =
  "M31 6.5C40 5.5 52 9.5 55.5 20C58 27 60.5 33 57 41C53.5 49.5 46 57 35 57.5C24.5 58.5 13 55 8.5 45C5 37.5 5.5 28 9 20C13 11.5 21.5 7.5 31 6.5Z";

/** A fried egg: sunny side up or flipped, whole or broken yolk. */
export function FriedEgg({
  sides = "en",
  yolk = "hel",
  size,
}: ArtProps & { sides?: Sides; yolk?: Yolk }) {
  const flipped = sides === "begge";
  // A flipped egg's yolk sits under a thin layer of cooked white: softer colour, no ink outline.
  const yolkStroke = flipped
    ? { stroke: "var(--egg-crisp)", strokeWidth: 1.5, strokeLinejoin: "round" as const }
    : STROKE;
  return (
    <Svg size={size}>
      {flipped && <path d={WHITE} fill="var(--egg-crisp)" />}
      <path
        d={WHITE}
        fill="var(--egg-white)"
        transform={flipped ? "translate(32 32) scale(.88) translate(-32 -32)" : undefined}
      />
      <path d={WHITE} fill="none" {...STROKE} />
      {yolk === "hel" ? (
        <>
          <circle
            cx={30}
            cy={30}
            r={10.5}
            fill={flipped ? "var(--yolk-cooked)" : "var(--yolk)"}
            {...yolkStroke}
          />
          {!flipped && (
            <ellipse cx={26.5} cy={26} rx={3.2} ry={2.2} fill="var(--egg-white)" opacity={0.75} />
          )}
        </>
      ) : (
        <>
          <path
            d="M19.5 31C18.5 24 25 19.5 31 20.5C37.5 21 42.5 26 40.5 32C43.5 35 45 40.5 41 41.5C38 42.5 37 39.5 35.5 39.5C31.5 42.5 24.5 42 22 37.5C20 36 19.5 33.5 19.5 31Z"
            fill={flipped ? "var(--yolk-cooked)" : "var(--yolk-runny)"}
            {...yolkStroke}
          />
          {!flipped && (
            <path
              d="M42 41.5C44 45 44.5 48 43 49"
              fill="none"
              stroke="var(--yolk-runny)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
        </>
      )}
      {flipped && (
        <ellipse cx={30} cy={31} rx={15} ry={13} fill="var(--egg-white)" opacity={0.35} />
      )}
    </Svg>
  );
}

export function SpecArt({ spec, size }: ArtProps & { spec: EggSpec }) {
  return spec.kind === "kokt" ? (
    <BoiledHalf doneness={spec.doneness} size={size} />
  ) : (
    <FriedEgg sides={spec.sides} yolk={spec.yolk} size={size} />
  );
}
