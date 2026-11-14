import type { ReactNode } from "react";

/** A radio input styled as a large, tappable row. Native radios keep arrow-key navigation. */
export function Choice({
  name,
  checked,
  onChange,
  art,
  label,
  hint,
  aside,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  art?: ReactNode;
  label: string;
  hint?: string;
  aside?: ReactNode;
}) {
  return (
    <label className="choice">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {art}
      <span className="choice-text">
        <span className="choice-label">{label}</span>
        {hint && <span className="choice-hint">{hint}</span>}
      </span>
      {aside && <span className="choice-aside">{aside}</span>}
      <span className="choice-mark" aria-hidden="true" />
    </label>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  size = "large",
}: {
  value: number;
  min: number;
  max: number;
  onChange: (delta: number) => void;
  /** What is being counted, used in the button labels, e.g. "egg". */
  label: string;
  size?: "large" | "small";
}) {
  return (
    <div className={`stepper stepper-${size}`}>
      <button
        type="button"
        onClick={() => onChange(-1)}
        disabled={value <= min}
        aria-label={value === 1 && min === 0 ? `Fjern ${label}` : `Ett ${label} færre`}
      >
        <Icon name={value === 1 && min === 0 ? "trash" : "minus"} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(1)}
        disabled={value >= max}
        aria-label={`Ett ${label} til`}
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}

const PATHS = {
  minus: "M6 12h12",
  plus: "M12 6v12M6 12h12",
  back: "M14.5 5.5 8 12l6.5 6.5",
  trash: "M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12",
  share: "M12 4v11M8 8l4-4 4 4M6 12v7h12v-7",
  close: "M7 7l10 10M17 7 7 17",
  sun: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
  moon: "M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z",
} as const;

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width={22}
      height={22}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={PATHS[name]}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
