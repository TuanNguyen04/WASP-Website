# WASP website (front-end prototype)

A static site using plain HTML, CSS and JS. There is no build step and no back end yet.

| Page | File |
|---|---|
| Project (home) | `index.html` |
| WASP-A animal survey | `wasp-a.html` |
| WASP-P parasites | `wasp-p.html` |
| WASP-B plants (coming soon, placeholder copy) | `wasp-b.html` |
| Team | `team.html` |
| Contact | `contact.html` |

## Preview locally

Open `index.html` in a browser, or run:

```
node .claude/serve.js
```

Then go to http://localhost:5173.

## WASP-A design notes

- **Unchanged survey content:** the question, the six traits, the 9-point labels, the "About this survey" text and the consent text are in `assets/js/species-data.js`. Answers are still sent as 1–9.
- **Hexagon scales** are coloured by scale type, following Nguyen et al. (2023):
  - Bipolar traits (cute, beautiful, important for ecosystem) use a diverging purple–green palette with a neutral middle.
  - One-directional traits (dangerous, intelligent) use sequential red and sequential blue.
  - Endangered uses the official IUCN Red List category colours, with the category guideline under the scale.
- **Group-level statistics only:** after rating, respondents see how *all respondents* perceive the species' animal group (one of the 10 IUCN groups). They never see results for a single species. The "Results so far" section shows a group × trait heatmap and the distributions for each group.
- **Contributor titles:** Contributor → Observer → Field Assistant → Naturalist → Field Researcher → Senior Researcher → Archivist → Curator → Guardian of the Archive. The page also has streaks, badges, a collection of the 10 groups and a personal species journal. All of this is stored on the visitor's device.
- **Scale-ready data layer** (`assets/js/api.js`): species are prefetched in batches, and ratings go through an outbox with batched, retried and idempotent sync. Statistics are pre-aggregated and cached. See **`docs/API-CONTRACT.md`**.

## Prototype limitations

- The survey uses a bundled sample of 51 real WASP-A species, 5–6 per group. Images load from the existing WASP media server.
- Group statistics are **illustrative mock data** until the back end provides `/v2/stats/groups`.
- To switch to the real API, set `MODE = 'live'` in `assets/js/api.js` once the endpoints exist.

## Sharing a draft on GitHub (GitHub Pages)

1. Create a GitHub repository, e.g. `wasp-website`. It must be **Public** for free GitHub Pages; private repositories need a paid plan for Pages.
2. Upload the files with one of these methods:
   - **In the browser:** on the repository's page click **Add file → Upload files**, drag in everything in this folder except `Media/`, and commit.
   - **With Git:** install it with `winget install Git.Git`, then run in this folder:
     ```
     git init
     git add .
     git commit -m "WASP website prototype"
     git branch -M main
     git remote add origin https://github.com/<you>/wasp-website.git
     git push -u origin main
     ```
3. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, then **main** and **/ (root)**, and click Save.
4. After about a minute the draft is live at `https://<you>.github.io/wasp-website/`.
5. Invite developers under **Settings → Collaborators** so they can open issues and pull requests.

`.nojekyll` makes GitHub serve the files as they are. `.gitignore` keeps the original `Media/` source files (including the paper PDF) out of the repository.
