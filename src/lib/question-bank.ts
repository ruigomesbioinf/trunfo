import "server-only";
import rawQuestions from "@/data/questions.json";
import { validateQuestions } from "./questions";

// Server only: importing this from a client component fails the build, so the
// correct answers can never end up in the browser bundle.
export const questionBank = validateQuestions(rawQuestions);
