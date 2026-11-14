# WASP-A: proposed API contract (front-end view)

**Status:** this is a proposal for discussion. The prototype runs in mock mode (`assets/js/api.js`, `MODE = 'mock'`). It does not prescribe how the back end is built. It only lists what the front end needs so that it keeps working with about 2,000 species and a large number of respondents.

The current production API (`https://wasp.orpolyzos.com`: `GET /question/random`, `POST /answer/list`) keeps working. The endpoints below are a versioned `/v2` alongside it.

## Design assumptions the front end already follows

| Concern | Front-end behaviour |
|---|---|
| Read load on species | Prefetches **5 species per request** and preloads the next images. |
| Write spikes | Ratings go to a local **outbox** and are POSTed in **batches of up to 20**. Failures retry with exponential backoff (1 s → 60 s). |
| Duplicate submissions | Every response has a client-generated **`responseId` (UUID)**. The server should treat it as an idempotency key. |
| Offline / flaky networks | Ratings are kept locally and synced when back online. The UI shows "Syncing…" or "Offline · n saved". |
| Statistics cost | The browser **only reads pre-aggregated statistics per animal group**. It never asks for per-species or raw data. It caches them for 10 minutes. |
| Anonymity | Uses an anonymous `respondentId` (UUID). No personal data is sent. |

## Endpoints

### `GET /v2/species/next?count=5`
Header: `X-Respondent-Id: <uuid>`. The server should prefer species this respondent has not rated yet.
```json
{ "items": [ { "id": 1480, "name": "Herennia multipuncta", "group": "invertebrates",
               "src": "https://…/medium/file/1480", "photographer": "(c) Chayant Gonsalves, some rights reserved (CC BY)",
               "licenseUrl": "https://creativecommons.org/licenses/by/4.0/" } ] }
```
`group` is one of `mammals, birds, fishes, reptiles, amphibians, insects, molluscs, crustaceans, corals, invertebrates`. The UI reveals it only after the species is rated.

### `POST /v2/responses`
```json
{ "responses": [ {
  "responseId": "6f1c…", "respondentId": "a2b9…", "observationId": 1480,
  "answers": { "CUTE": 7, "DANGEROUS": 2, "INTELLIGENT": 5, "BEAUTIFUL": 8, "ENDANGERED": 4, "IMPORTANT_FOR_ECOSYSTEMS": 9 },
  "ratedAt": "2026-11-14T10:22:31.000Z" } ] }
```
→ `202 Accepted`. Answers use values 1–9, the same as today. Repeating a `responseId` must have no further effect.

### `GET /v2/stats/groups`
Pre-aggregated, for example refreshed every few minutes. Suggested `Cache-Control: public, max-age=300`.
```json
{ "updatedAt": "2026-11-14T10:15:00Z",
  "totals": { "responses": 88955, "respondents": 7803, "countries": 74 },
  "groups": [ { "id": "mammals", "species": 200, "responses": 6200,
                "questions": { "CUTE": { "n": 6200, "mean": 6.62, "hist": [12, 40, 96, 230, 610, 1100, 1650, 1500, 962] } } } ] }
```
`hist[i]` is the number of answers with value `i + 1`. The front end draws the group histograms, the group mean and the heatmap from this payload only.

## Not needed by the front end (yet)
- **Accounts or nicknames:** only needed if a public "hall of contributors" is wanted. Contributor titles currently live on the respondent's device.
- **Cross-device progress:** this would need `GET /v2/respondents/me/progress`.
