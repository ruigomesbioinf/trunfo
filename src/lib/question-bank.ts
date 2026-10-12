import "server-only";
import rawQuestions from "@/data/questions.json";
import { validateQuestions } from "./questions";

export const questionBank = validateQuestions(rawQuestions);
