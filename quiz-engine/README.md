# MPPSC IQ JSON Revision Quiz (v92)

This is the isolated JSON-driven copy of the existing revision quiz. The previous `mppsc-iq-pre2027-revision-unit-wise-quiz-91.html` remains unchanged and remains the active route until the new copy is manually tested.

## Files

- `quiz-data/revision-units-92.json` — question content only, grouped by unit.
- `quiz-engine/revision-quiz-engine-92.js` — quiz behavior; loads the JSON file with `fetch()`.
- `mppsc-iq-pre2027-revision-unit-wise-quiz-92-json.html` — UI page that loads the independent engine.

## Data format

```json
{
  "schemaVersion": 1,
  "program": "MPPSC PRE 2027 Revision Unit-wise Quiz",
  "source": "mppsc-iq-pre2027-revision-unit-wise-quiz-91.html",
  "units": {
    "2": [{ "q": "...", "en": "...", "options": ["A", "B", "C", "D"], "answer": 0 }]
  }
}
```

- `answer` is a zero-based option index, matching the legacy quiz.
- Existing question objects are preserved; do not silently normalize special records.
- Add a new unit under `units` in the JSON file. The engine builds `UNIT_DATA_MAP` from the data file, so question content does not need to be embedded in or copied into the engine.
- Keep the previous HTML file as rollback until the JSON-driven page has been tested on mobile and Telegram WebView.
