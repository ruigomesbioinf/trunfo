import { describe, expect, it } from "vitest";
import rawQuestions from "./questions.json";
import { validateQuestions } from "../lib/questions";

// Runs on every `npm test`, so a typo in questions.json is caught immediately.
describe("questions.json", () => {
  it("is valid", () => {
    expect(() => validateQuestions(rawQuestions)).not.toThrow();
  });
});
