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

You don't choose the order of the options or where the correct one goes: the game shuffles them, and every player sees them in a new random order each time, even when replaying the same seed.

## Rules for a good bank

- The difficulty of each question follows the ladder: **1** on 0 € and 200 €, **1 or 2** (50/50, drawn by the seed) on 500 €, **2** on 1000 €, **2 or 3** (50/50, drawn by the seed) on 3000 €, **3** on 10 000 € and 50 000 €. In **solo** it is the step the player is on, so it depends on how they are doing. In **multiplayer** it is always the step of a player who answers everything right, so every player of a seed gets exactly the same 12 questions: 1, 1, then 1 or 2, 2, 2 or 3, and 3 from question 6 on. Either way any difficulty can come up in a game, so you need **at least 12 questions of each difficulty** (the length of a game), otherwise the game is not available. Aim for **30 or more of each**, otherwise different seeds will keep repeating the same questions.
- **Append only.** Seeds pick questions from the whole bank, so adding questions changes what existing seeds produce, and removing them is worse. Fix typos freely, but avoid deleting questions that have been in use.
- Write every question so it has a single, checkable correct answer, and avoid facts that change often (records, office holders, populations).
- JSON is strict: use double quotes, put commas between entries, and no comma after the last one.
