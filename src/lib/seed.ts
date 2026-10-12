export const SEED_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

const SEED_LENGTH = 7;
const SEED_GROUP_SIZE = 4;

const MAX_UNBIASED_BYTE =
  Math.floor(256 / SEED_ALPHABET.length) * SEED_ALPHABET.length;

function formatSeed(chars: string): string {
  return `${chars.slice(0, SEED_GROUP_SIZE)}-${chars.slice(SEED_GROUP_SIZE)}`;
}

export function generateSeed(): string {
  let chars = "";

  while (chars.length < SEED_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(SEED_LENGTH));

    for (const byte of bytes) {
      if (byte < MAX_UNBIASED_BYTE && chars.length < SEED_LENGTH) {
        chars += SEED_ALPHABET[byte % SEED_ALPHABET.length];
      }
    }
  }

  return formatSeed(chars);
}

export function parseSeed(input: unknown): string | null {
  if (typeof input !== "string") return null;

  const chars = input.replace(/[\s-]/g, "").toUpperCase();

  if (chars.length !== SEED_LENGTH) return null;
  if (![...chars].every((char) => SEED_ALPHABET.includes(char))) return null;

  return formatSeed(chars);
}
