# WASP website (front-end prototype)

A static site using plain HTML, CSS and JS. There is no build step and no back end yet.

| Page | File |
|---|---|
| Project (home) | `index.html` |
| WASP-A animal survey (survey only) | `wasp-a.html` |
| My field journal (titles, badges, rated species) | `journal.html` |
| Results so far (group-level statistics) | `results.html` |
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

## Brand

White pages with CMK green (`#2CA13F`) for actions, the WASP-logo charcoal (`#2F2F30`) for text and the footer, and the wasp's amber (`#F2B51D`) only for rewards. Fonts: Outfit (headings) and Inter (text). The header uses the logo's globe emblem (`assets/img/wasp-emblem-dark.png`, cut from the 2022 logo) with the project name as real text. The full logo is in the footer.

## WASP-A design notes

- **Original survey preserved:** the question, the six traits with their original colours, the 9-point labels, the "About this survey" and consent texts, the species photos with their credits, and the "CONTACT WASP" footer with the CMK logo all come from wasp-project.net/survey. Answers are still sent as 1–9.
- **Survey only:** the page shows one species at a time. After **Rate**, the next species (already preloaded) appears immediately, with no results screen in between. On phones the six traits come in two sets of three, as on the original site.
- **Hexagon scales** are coloured by scale type, following Nguyen et al. (2023):
  - Bipolar traits (cute, beautiful, important for ecosystem): slate (negative) → light neutral → the trait's original colour.
  - One-directional traits (dangerous, intelligent): light tint → the trait's colour.
  - Endangered: official IUCN Red List category colours, with the category guideline under the scale.
- **Light-touch engagement:** a slim chip above the card shows the contributor title, the number of species rated and any streak, and links to the journal. New titles and badges appear as short notifications. Titles: Contributor → Observer → Field Assistant → Naturalist → Field Researcher → Senior Researcher → Archivist → Curator → Guardian of the Archive. All of this is stored on the visitor's device.
- **Statistics live on their own page** (`results.html`): a group × trait heatmap and the distributions for each of the 10 IUCN groups. There is never anything per species.
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
