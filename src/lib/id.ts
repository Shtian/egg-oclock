/**
 * A random id for an order line. Uses `crypto.getRandomValues` rather than
 * `crypto.randomUUID`, which only exists in secure contexts (HTTPS/localhost) and
 * so crashes when the app is opened over plain HTTP, e.g. a LAN or Tailscale IP.
 */
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
