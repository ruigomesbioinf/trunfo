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
| `difficulty` | yes | `1` easy, `2` medium, `3` hard. Nothing else is allowed. |
| `topic` | no | Free text (`história`, `ciência`, `geografia`, …). Never shown to players. |

You don't choose the order of the options or where the correct one goes: the game shuffles them from the seed.

## Rules for a good bank

- The difficulty of each question depends on the step of the ladder the player is on: **1** on 0 € and 200 €, **1 or 2** (50/50) on 500 €, **2** on 1000 €, **2 or 3** (50/50) on 3000 €, **3** on 10 000 € and 50 000 €. Since that depends on how the player is doing, any difficulty can come up at any question, so you need **at least 12 questions of each difficulty** (the length of a game), otherwise the game is not available. Aim for **30 or more of each**, otherwise different seeds will keep repeating the same questions.
- **Append only.** Seeds pick questions from the whole bank, so adding questions changes what existing seeds produce, and removing them is worse. Fix typos freely, but avoid deleting questions that have been in use.
- Write every question so it has a single, checkable correct answer, and avoid facts that change often (records, office holders, populations).
- JSON is strict: use double quotes, put commas between entries, and no comma after the last one.
