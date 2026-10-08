import { describe, expect, it } from "vitest";
import { SEED_ALPHABET, generateSeed, parseSeed } from "./seed";

describe("generateSeed", () => {
  it("returns a seed in the XXXX-XXX format", () => {
    expect(generateSeed()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{3}$/);
  });

  it("only uses characters from the allowed alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const chars = generateSeed().replace("-", "");
      expect([...chars].every((c) => SEED_ALPHABET.includes(c))).toBe(true);
    }
  });

  it("never uses confusing characters", () => {
    expect(SEED_ALPHABET).not.toMatch(/[01OILU]/);
  });

  it("produces valid, distinct seeds", () => {
    const seeds = Array.from({ length: 1000 }, generateSeed);

    expect(seeds.every((seed) => parseSeed(seed) === seed)).toBe(true);
    expect(new Set(seeds).size).toBe(seeds.length);
  });
});

describe("parseSeed", () => {
  it("returns a canonical seed unchanged", () => {
    expect(parseSeed("7K4M-92Q")).toBe("7K4M-92Q");
  });

  it("accepts lowercase and surrounding spaces", () => {
    expect(parseSeed("  7k4m-92q  ")).toBe("7K4M-92Q");
  });

  it("accepts a seed without the hyphen", () => {
    expect(parseSeed("7K4M92Q")).toBe("7K4M-92Q");
  });

  it("accepts spaces instead of the hyphen", () => {
    expect(parseSeed("7K4M 92Q")).toBe("7K4M-92Q");
  });

  it("rejects an empty string", () => {
    expect(parseSeed("")).toBeNull();
  });

  it("rejects seeds that are too short or too long", () => {
    expect(parseSeed("7K4M-92")).toBeNull();
    expect(parseSeed("7K4M-92QX")).toBeNull();
  });

  it.each(["0", "O", "1", "I", "L", "U"])(
    "rejects the forbidden character %s",
    (char) => {
      expect(parseSeed(`7K4M-92${char}`)).toBeNull();
    },
  );

  it("rejects other punctuation", () => {
    expect(parseSeed("7K4M_92Q")).toBeNull();
    expect(parseSeed("7K4M.92Q")).toBeNull();
  });

  it("rejects values that are not strings", () => {
    expect(parseSeed(undefined)).toBeNull();
    expect(parseSeed(null)).toBeNull();
    expect(parseSeed(1234567)).toBeNull();
  });
});
