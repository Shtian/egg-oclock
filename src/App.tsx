import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { Choice, Icon, Stepper } from "./components/Choice";
import { BoiledHalf, EggInCup, FriedEgg } from "./components/EggArt";
import { OrderView } from "./components/OrderView";
import { useOrder } from "./hooks/useOrder";
import { useTheme } from "./hooks/useTheme";
import { shareUrl } from "./lib/share";
import {
  DONENESS,
  MAX_PER_LINE,
  orderText,
  SIDES,
  specLabel,
  totalEggs,
  YOLK,
  type Doneness,
  type EggKind,
  type EggSpec,
  type OrderLine,
  type Sides,
  type Yolk,
} from "./lib/order";

type Screen = "order" | "kind" | "how" | "who";
const WIZARD: Screen[] = ["kind", "how", "who"];

type HistoryState = { screen: Screen; depth: number };

/** Which way the screens slide: deeper into the wizard, back out of it, or not at all. */
type Direction = "forward" | "back" | "none";

/** "Angre" brings back `restoreTo` (the order) and/or `restoreNames` (the saved names). */
type Toast = { id: number; text: string; restoreTo?: OrderLine[]; restoreNames?: string[] };
const canUndo = (t: Toast) => Boolean(t.restoreTo || t.restoreNames);
const toastDuration = (t: Toast) => (canUndo(t) ? 8000 : 4000);

export default function App({ shared }: { shared: OrderLine[] | null }) {
  const order = useOrder(shared);
  const { theme, toggle: toggleTheme } = useTheme();
  // Spin the sun/moon only after a tap, not on page load.
  const [themeTapped, setThemeTapped] = useState(false);
  const { lines } = order;
  const total = totalEggs(lines);

  // Draft egg. Settings carry over to the next egg, since households often order alike.
  const [kind, setKind] = useState<EggKind>("kokt");
  const [doneness, setDoneness] = useState<Doneness>("medium");
  const [sides, setSides] = useState<Sides>("en");
  const [yolk, setYolk] = useState<Yolk>("hel");
  const [count, setCount] = useState(1);
  const [who, setWho] = useState("");
  const spec: EggSpec = kind === "kokt" ? { kind, doneness } : { kind, sides, yolk };

  const { screen, direction, go, home } = useScreens(total > 0 ? "order" : "kind");

  // Move focus to the new screen's heading so keyboard and screen reader users follow along.
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [screen]);

  // Opened from a shared link: say so, and offer to get the replaced order back.
  const [toast, setToast] = useState<Toast | null>(() => {
    if (!shared) return null;
    const previous = order.previous ?? [];
    const replaced = previous.length > 0 && orderText(previous) !== orderText(shared);
    const eggs = totalEggs(shared);
    return {
      id: 0,
      text: replaced ? `Viser delt bestilling (${eggs} egg)` : "Viser delt bestilling",
      restoreTo: replaced ? previous : undefined,
    };
  });
  const toastId = useRef(0);
  const showToast = (text: string, restoreTo?: OrderLine[]) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text, restoreTo });
  };
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toastDuration(toast));
    return () => window.clearTimeout(t);
  }, [toast]);

  const undo = (t: Toast) => {
    if (t.restoreTo) order.replace(t.restoreTo);
    if (t.restoreNames) order.replaceNames(t.restoreNames);
    setToast(null);
  };

  const forgetName = (name: string) => {
    const before = order.names;
    order.removeName(name);
    toastId.current += 1;
    setToast({
      id: toastId.current,
      text: `Fjernet ${name} fra lagrede navn`,
      restoreNames: before,
    });
    // The focused button is gone. Focus the name list, not the input, so no keyboard pops up.
    const list = document.getElementById("saved-names");
    (list ?? document.getElementById("who"))?.focus();
  };

  const submit = () => {
    const before = lines;
    order.add(spec, count, who);
    const name = who.trim();
    const eggs = count === 1 ? "1 egg" : `${count} egg`;
    showToast(name ? `La til ${eggs} til ${name}` : `La til ${eggs}`, before);
    setCount(1);
    setWho("");
    home();
  };

  // An undo for the order makes no sense once you are inside the wizard.
  const startOrder = () => {
    setToast(null);
    go("kind");
  };

  const share = async () => {
    const link = shareUrl(lines, location.href);
    const text = `${orderText(lines)}\n\nSe bestillingen i appen:\n${link}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("Bestillingen er kopiert");
    } catch (err) {
      if ((err as Error).name !== "AbortError") showToast("Fikk ikke delt bestillingen");
    }
  };

  const clear = () => {
    const before = lines;
    order.replace([]);
    showToast("Bestillingen er tømt", before);
  };

  const stepIndex = WIZARD.indexOf(screen);
  const inWizard = stepIndex >= 0;
  const canGoBack = screen !== "order" && (screen !== "kind" || total > 0);

  return (
    <>
      <main className="app">
        <header className="top">
          {canGoBack ? (
            <button
              type="button"
              className="icon-button"
              onClick={() => history.back()}
              aria-label="Tilbake"
            >
              <Icon name="back" />
            </button>
          ) : null}
          <p className="brand">Egg o'clock</p>
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={() => {
              setThemeTapped(true);
              toggleTheme();
            }}
            aria-label={theme === "dark" ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
          >
            <span className={themeTapped ? "theme-icon spin" : "theme-icon"} key={theme}>
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </span>
          </button>
          {inWizard && total > 0 ? (
            <button type="button" className="basket" onClick={home}>
              Bestilling{" "}
              <span className="basket-count" key={total}>
                {total}
              </span>
            </button>
          ) : null}
        </header>

        {inWizard && (
          <div className="progress">
            <p className="progress-label">
              Steg {stepIndex + 1} av {WIZARD.length}
            </p>
            <ol className="progress-bar" aria-hidden="true">
              {WIZARD.map((s, i) => (
                <li key={s} className={i <= stepIndex ? "done" : undefined} />
              ))}
            </ol>
          </div>
        )}

        <div
          className="screen"
          key={screen}
          // Browsers with view transitions animate the swap themselves (see `transition`).
          data-enter={supportsViewTransitions() ? undefined : direction}
        >
          {screen === "order" && (
            <OrderView
              headingRef={heading}
              lines={lines}
              onChange={order.change}
              onAdd={startOrder}
              onShare={share}
              onClear={clear}
            />
          )}

          {screen === "kind" && (
            <section className="step">
              <h2 ref={heading} tabIndex={-1}>
                Kokt eller stekt?
              </h2>
              <div className="kind-list">
                <button
                  type="button"
                  className="kind kind-kokt"
                  onClick={() => {
                    setKind("kokt");
                    go("how");
                  }}
                >
                  <EggInCup size={72} />
                  <span className="choice-text">
                    <span className="choice-label">Kokt</span>
                    <span className="choice-hint">Bløtkokt, medium eller hardkokt</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="kind kind-stekt"
                  onClick={() => {
                    setKind("stekt");
                    go("how");
                  }}
                >
                  <FriedEgg size={72} />
                  <span className="choice-text">
                    <span className="choice-label">Stekt</span>
                    <span className="choice-hint">Speilegg eller snudd i panna</span>
                  </span>
                </button>
              </div>
            </section>
          )}

          {screen === "how" && kind === "kokt" && (
            <section className="step">
              <h2 ref={heading} tabIndex={-1}>
                Hvordan vil du ha plomma?
              </h2>
              <fieldset className="choices">
                <legend className="sr-only">Koketid</legend>
                {DONENESS.map((o) => (
                  <Choice
                    key={o.value}
                    name="doneness"
                    checked={doneness === o.value}
                    onChange={() => setDoneness(o.value)}
                    art={<BoiledHalf doneness={o.value} size={52} />}
                    label={o.label}
                    hint={o.hint}
                    aside={`${o.minutes} min`}
                  />
                ))}
              </fieldset>
              <div className="actions">
                <button type="button" className="primary" onClick={() => go("who")}>
                  Neste
                </button>
              </div>
            </section>
          )}

          {screen === "how" && kind === "stekt" && (
            <section className="step">
              <h2 ref={heading} tabIndex={-1}>
                Hvordan skal det stekes?
              </h2>
              <FriedPreview sides={sides} yolk={yolk} />
              <fieldset className="choices pair">
                <legend>Steking</legend>
                {SIDES.map((o) => (
                  <Choice
                    key={o.value}
                    name="sides"
                    checked={sides === o.value}
                    onChange={() => setSides(o.value)}
                    label={o.label}
                    hint={o.hint}
                  />
                ))}
              </fieldset>
              <fieldset className="choices pair">
                <legend>Plomme</legend>
                {YOLK.map((o) => (
                  <Choice
                    key={o.value}
                    name="yolk"
                    checked={yolk === o.value}
                    onChange={() => setYolk(o.value)}
                    label={o.label}
                    hint={o.hint}
                  />
                ))}
              </fieldset>
              <div className="actions">
                <button type="button" className="primary" onClick={() => go("who")}>
                  Neste
                </button>
              </div>
            </section>
          )}

          {screen === "who" && (
            <form
              className="step"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <h2 ref={heading} tabIndex={-1}>
                Hvor mange, og til hvem?
              </h2>
              <p className="recap">
                {kind === "kokt" ? "Kokt" : "Stekt"}, {specLabel(spec).toLowerCase()}
              </p>

              <div className="field">
                <span className="field-label" id="count-label">
                  Antall egg
                </span>
                <div role="group" aria-labelledby="count-label">
                  <Stepper
                    value={count}
                    min={1}
                    max={MAX_PER_LINE}
                    label="egg"
                    onChange={(d) => setCount((c) => Math.min(MAX_PER_LINE, Math.max(1, c + d)))}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="who">
                  Navn <span className="optional">(valgfritt)</span>
                </label>
                <input
                  id="who"
                  className="text-input"
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint="done"
                  maxLength={30}
                  aria-describedby="who-help"
                />
                <p className="field-help" id="who-help">
                  Så kokken vet hvem som skal ha hva.
                </p>
                {order.names.length > 0 && (
                  <div
                    id="saved-names"
                    className="name-chips"
                    role="group"
                    aria-label="Lagrede navn"
                    tabIndex={-1}
                  >
                    {order.names.map((n) => (
                      <span key={n} className="name-chip">
                        <button
                          type="button"
                          className="name-chip-pick"
                          aria-pressed={
                            who.trim().toLocaleLowerCase("nb") === n.toLocaleLowerCase("nb")
                          }
                          onClick={() => setWho(n)}
                        >
                          {n}
                        </button>
                        <button
                          type="button"
                          className="name-chip-remove"
                          aria-label={`Fjern ${n} fra lagrede navn`}
                          onClick={() => forgetName(n)}
                        >
                          <Icon name="close" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="actions">
                <button type="submit" className="primary">
                  Legg til {count === 1 ? "1 egg" : `${count} egg`}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        data-above={screen === "order" && total > 0 ? "tall" : "short"}
      >
        {toast && (
          <div
            className="toast"
            key={toast.id}
            style={{ "--toast-duration": `${toastDuration(toast)}ms` } as CSSProperties}
          >
            <span>{toast.text}</span>
            {canUndo(toast) && (
              <button type="button" className="toast-undo" onClick={() => undo(toast)}>
                Angre
              </button>
            )}
            <button
              type="button"
              className="toast-close"
              onClick={() => setToast(null)}
              aria-label="Lukk melding"
            >
              <svg className="toast-timer" viewBox="0 0 36 36" aria-hidden="true">
                <circle className="toast-timer-track" cx="18" cy="18" r="16" pathLength="100" />
                <circle className="toast-timer-ring" cx="18" cy="18" r="16" pathLength="100" />
              </svg>
              <Icon name="close" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The big fried egg on the frying step. Picking a side flips it in the pan and
 * changing the yolk gives it a wobble, but only once you have changed something:
 * it sits still while the screen slides in.
 */
function FriedPreview({ sides, yolk }: { sides: Sides; yolk: Yolk }) {
  const [shown, setShown] = useState({ sides, yolk });
  const [changed, setChanged] = useState(false);
  if (shown.sides !== sides || shown.yolk !== yolk) {
    setShown({ sides, yolk });
    setChanged(true);
  }
  return (
    <div className="preview" aria-hidden="true">
      {/* Keyed, so each change restarts its animation. */}
      <div className={changed ? "preview-flip" : undefined} key={sides}>
        <div className={changed ? "preview-wobble" : undefined} key={yolk}>
          <FriedEgg sides={sides} yolk={yolk} size={112} />
        </div>
      </div>
    </div>
  );
}

/**
 * Screen navigation backed by browser history, so the phone's back gesture
 * steps back through the wizard. The order overview is always the bottom entry.
 */
function useScreens(initial: Screen) {
  const [{ screen, direction }, setState] = useState<{ screen: Screen; direction: Direction }>({
    screen: initial,
    direction: "none",
  });
  const depth = useRef(0);

  useEffect(() => {
    const adopt = (state: HistoryState | null, animate: boolean) => {
      const nextDepth = state?.depth ?? 0;
      const dir: Direction = !animate ? "none" : nextDepth < depth.current ? "back" : "forward";
      depth.current = nextDepth;
      transition(dir, () => setState({ screen: state?.screen ?? "order", direction: dir }));
    };
    const existing = history.state as HistoryState | null;
    if (existing?.screen) {
      // Reload (or a second mount): stay where the history says we are.
      adopt(existing, false);
    } else {
      history.replaceState({ screen: "order", depth: 0 } satisfies HistoryState, "");
      if (initial !== "order") {
        depth.current = 1;
        history.pushState({ screen: initial, depth: 1 } satisfies HistoryState, "");
      }
    }
    // A swipe-back gesture (iOS Safari) already animates the page; don't animate it twice.
    const onPop = (e: PopStateEvent) =>
      adopt(e.state as HistoryState | null, !e.hasUAVisualTransition);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // Runs once on mount; `initial` is only the starting screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = useCallback((next: Screen) => {
    depth.current += 1;
    history.pushState({ screen: next, depth: depth.current }, "");
    transition("forward", () => setState({ screen: next, direction: "forward" }));
  }, []);

  /** Back to the order overview, dropping the wizard entries from history. */
  const home = useCallback(() => {
    if (depth.current > 0) history.go(-depth.current);
    else transition("back", () => setState({ screen: "order", direction: "back" }));
  }, []);

  return { screen, direction, go, home };
}

const supportsViewTransitions = () =>
  typeof document.startViewTransition === "function" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeTransition: ViewTransition | null = null;

/**
 * Swaps screens inside a view transition, so the old screen slides out as the
 * new one slides in. `data-nav` on <html> tells the CSS which way to slide.
 * Without view transition support the update just applies, and the screen's
 * own CSS enter animation (data-enter) runs instead.
 */
function transition(direction: Direction, update: () => void) {
  if (direction === "none" || !supportsViewTransitions()) {
    update();
    return;
  }
  const root = document.documentElement;
  root.dataset.nav = direction;
  const t = document.startViewTransition(() => flushSync(update));
  activeTransition = t;
  void t.finished.finally(() => {
    if (activeTransition === t) {
      activeTransition = null;
      delete root.dataset.nav;
    }
  });
}
