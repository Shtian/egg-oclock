import type { Ref } from "react";
import {
  boilPlan,
  DONENESS,
  groupBySpec,
  MAX_PER_LINE,
  specLabel,
  totalEggs,
  type OrderLine,
} from "../lib/order";
import { Icon, Stepper } from "./Choice";
import { EggInCup, SpecArt } from "./EggArt";

type Props = {
  lines: OrderLine[];
  onChange: (id: string, delta: number) => void;
  onAdd: () => void;
  onShare: () => void;
  onClear: () => void;
  headingRef: Ref<HTMLHeadingElement>;
};

const doneLabel = (d: string) => DONENESS.find((o) => o.value === d)!.label.toLowerCase();

export function OrderView({
  lines,
  onChange,
  onAdd,
  onShare,
  onClear,
  headingRef: heading,
}: Props) {
  const total = totalEggs(lines);

  if (total === 0) {
    return (
      <section className="step empty">
        <EggInCup size={96} />
        <h2 ref={heading} tabIndex={-1}>
          Ingen egg bestilt ennå
        </h2>
        <p className="lead">
          Legg til et egg for hver som skal ha frokost. Bestillingen lagres på telefonen.
        </p>
        <div className="actions">
          <button type="button" className="primary" onClick={onAdd}>
            Bestill egg
          </button>
        </div>
      </section>
    );
  }

  const groups = groupBySpec(lines);
  const plan = boilPlan(lines);
  const fried = groups.filter((g) => g.spec.kind === "stekt");

  return (
    <section className="step">
      <h2 ref={heading} tabIndex={-1}>
        {total === 1 ? "1 egg i bestillingen" : `${total} egg i bestillingen`}
      </h2>

      {(["kokt", "stekt"] as const).map((kind) => {
        const rows = groups.filter((g) => g.spec.kind === kind).flatMap((g) => g.lines);
        if (rows.length === 0) return null;
        return (
          <div key={kind} className="order-group">
            <h3>{kind === "kokt" ? "Kokte" : "Stekte"}</h3>
            <ul className="order-list">
              {rows.map((line) => (
                <li key={line.id} className="order-row">
                  <SpecArt spec={line.spec} size={44} />
                  <span className="order-text">
                    <span className="order-label">{specLabel(line.spec)}</span>
                    <span className="order-who">{line.who ? `Til ${line.who}` : "Uten navn"}</span>
                  </span>
                  <Stepper
                    size="small"
                    value={line.count}
                    min={0}
                    max={MAX_PER_LINE}
                    label={`${specLabel(line.spec).toLowerCase()} egg${line.who ? ` til ${line.who}` : ""}`}
                    onChange={(d) => onChange(line.id, d)}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="kitchen">
        <h3>På kjøkkenet</h3>
        {plan.steps.length > 0 && (
          <>
            <p className="kitchen-intro">
              Kokeplan fra kokende vann, så alle blir ferdige samtidig:
            </p>
            <ol className="timeline">
              {plan.steps.map((s) => (
                <li key={s.doneness}>
                  <span className="time">{s.atMinute === 0 ? "Start" : `${s.atMinute} min`}</span>
                  <span>
                    Legg i {s.count} {doneLabel(s.doneness)}
                  </span>
                </li>
              ))}
              <li>
                <span className="time">{plan.totalMinutes} min</span>
                <span>Alle opp i kaldt vann</span>
              </li>
            </ol>
          </>
        )}
        {fried.length > 0 && (
          <ul className="fry-list">
            {fried.map((g) => (
              <li key={g.key}>
                <strong>{g.count}</strong> stekt, {specLabel(g.spec).toLowerCase()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="actions">
        <button type="button" className="primary" onClick={onAdd}>
          Legg til egg
        </button>
        <div className="actions-row">
          <button type="button" className="secondary" onClick={onShare}>
            <Icon name="share" />
            Del bestillingen
          </button>
          <button type="button" className="quiet danger" onClick={onClear}>
            Tøm
          </button>
        </div>
      </div>
    </section>
  );
}
