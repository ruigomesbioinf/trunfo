import { describe, expect, it } from "vitest";
import rawQuestions from "./questions.json";
import { questionAfter, validateQuestions } from "../lib/questions";

describe("questions.json", () => {
  it("is valid", () => {
    expect(() => validateQuestions(rawQuestions)).not.toThrow();
  });

  it("has enough questions of every difficulty to play", () => {
    const bank = validateQuestions(rawQuestions);

    expect(() => questionAfter("7K4M-92Q", bank, [])).not.toThrow();
  });
});
