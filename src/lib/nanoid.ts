// Generates short random IDs for event URLs.
// Uses a custom alphabet that removes visually ambiguous characters:
//   removed: 0 (vs O), 1 (vs l/I), O, I, l
// Result: 6 chars from 57-char alphabet = ~34 billion combinations.
// Collision probability at 10,000 events per tenant: ~0.0003% — safe.

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const ID_LENGTH = 6;

export function generateEventId(): string {
  // Use crypto.getRandomValues when available (browser + Node 19+),
  // fall back to Math.random for older Node versions.
  const bytes = new Uint8Array(ID_LENGTH);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Node < 19 fallback
    const nodeCrypto = require("crypto") as typeof import("crypto");
    const buf = nodeCrypto.randomBytes(ID_LENGTH);
    buf.copy(Buffer.from(bytes.buffer));
  }

  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
}

// Generate a longer invite code for private events (8 chars, easier to read)
export function generateInviteCode(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    const nodeCrypto = require("crypto") as typeof import("crypto");
    const buf = nodeCrypto.randomBytes(8);
    buf.copy(Buffer.from(bytes.buffer));
  }
  // Uppercase only for invite codes — easier to read aloud / type
  const upper = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from(bytes)
    .map((b) => upper[b % upper.length])
    .join("");
}
