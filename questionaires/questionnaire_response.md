QuestionnaireResponse rules:

Only use these rules after a user submits answers to an approved FHIR Questionnaire form.

The frontend sends answers only. Private context is appended by the backend:

- selected Questionnaire id
- patient id
- encounter id
- FHIR base URL
- FHIR token

Build a FHIR `QuestionnaireResponse` with this structure:

```json
{
  "resourceType": "QuestionnaireResponse",
  "questionnaire": "Questionnaire/{questionnaire_id}",
  "status": "in-progress",
  "subject": {
    "reference": "Patient/{patient_id}"
  },
  "encounter": {
    "reference": "Encounter/{encounter_id}"
  },
  "item": []
}
```

Response item rules:

- Use the selected approved Questionnaire as the source structure.
- Preserve every `linkId` exactly.
- Preserve the nested `item` tree.
- Copy `text` from the selected Questionnaire item.
- Add `answer` only when the frontend submitted an answer for that `linkId`.
- Keep unanswered group/display/question items in the response tree without `answer`.
- Do not invent `linkId`, `text`, answers, patient references, encounter references, or questionnaire references.
- Do not output `id`, `meta.versionId`, or `meta.lastUpdated` for a new create request. The FHIR server assigns those.

Answer value mapping:

- `boolean` -> `valueBoolean`
- `decimal` -> `valueDecimal`
- `integer` -> `valueInteger`
- `date` -> `valueDate`
- `dateTime` -> `valueDateTime`
- `time` -> `valueTime`
- `string` or `text` -> `valueString`
- `url` -> `valueUri`
- `choice` or `open-choice` with a coding object -> `valueCoding`
- `choice` or `open-choice` with text -> `valueString`
- `quantity` -> `valueQuantity`
- `reference` -> `valueReference`
- `attachment` -> `valueAttachment`

Validation before FHIR POST:

- Every submitted answer `linkId` must exist in the selected Questionnaire.
- Answer value type must match the selected Questionnaire item type.
- Required leaf questions must have answers.

Submit only after validation passes:

```text
POST /QuestionnaireResponse
```
