# Question bank

All questions live in [`questions.json`](./questions.json). Run `npm test` after editing: it tells you exactly which question is wrong.

## Format

```json
{
  "id": "q005",
  "question": "Qual é o maior planeta do Sistema Solar?",
  "correct": "Júpiter",
  "wrong": ["Saturno", "Neptuno", "Terra"],
  "difficulty": 1,
  "topic": "ciência"
}
```

| Field | Required | Rules |
|---|---|---|
| `id` | yes | Unique. Use `q001`, `q002`, … in order. **Never reuse or renumber an id.** |
| `question` | yes | The text shown to the player. Must be unique. |
| `correct` | yes | The one right answer. |
| `wrong` | yes | **Exactly 3** wrong answers, all different from each other and from `correct`. |
| `difficulty` | yes | `0` unrated, `1` easy, `2` medium, `3` hard. |
| `topic` | no | Free text (`história`, `ciência`, `geografia`, …). Never shown to players. |

You don't choose the order of the options or where the correct one goes: the game shuffles them from the seed.

## Rules for a good bank

- Every game uses **3 questions of each difficulty** (0 to 3). A difficulty with no questions is skipped and its slots go to the first difficulty that has some, so a bank made only of `0` still gives 12-question games. Otherwise you need at least 3 of each. Aim for **30 or more of each**, otherwise different seeds will keep repeating the same questions.
- **Append only.** Seeds pick questions from the whole bank, so adding questions changes what existing seeds produce, and removing them is worse. Fix typos freely, but avoid deleting questions that have been in use.
- Write every question so it has a single, checkable correct answer, and avoid facts that change often (records, office holders, populations).
- JSON is strict: use double quotes, put commas between entries, and no comma after the last one.
