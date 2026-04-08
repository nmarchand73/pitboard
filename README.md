# Pitboard

Web app for reading the **manufacturer maintenance schedule** as an interactive grid (same structure as the paper service booklet), filtering by interval column, and opening the **factory manual PDF** at the listed page. Built for workshop and mobile use.

Some bikes also show a **Remarks** column when the data includes `remarks` (lubricants, slacks, chapter cross-references, and other OEM notes from the manual).

**Repository:** [github.com/nmarchand73/pitboard](https://github.com/nmarchand73/pitboard)

**Live (GitHub Pages):** [nmarchand73.github.io/pitboard](https://nmarchand73.github.io/pitboard/)

## Supported bikes (data shipped in repo)

| ID | Label | Manual (in `public/manuals/`) | Notes |
|----|--------|---------------------------------|--------|
| `ktm-85-sx-2022` | KTM 85 SX 2022 | `ktm-85-sx-2022.pdf` | Hour / event / calendar columns; `pageOffset: 2` (book page → PDF page). Recommended block badge `9.3` via `carnetRecommendedBadge`. |
| `yz-125-2007` | Yamaha YZ 125 2007 | `yz-125-2007.pdf` | Race-based columns (break-in, every race, 3rd / 5th race, if needed). **`remarks`** on many rows. Each task `page` is a **PDF file page** (`pageOffset: 0`) opening on the **French procedure** (ch. 3 inspections, ch. 4–5 démontages), not only the tableau « programme d’entretien » (3-1–3-3). |

## Prerequisites

- **Node.js** 20+ locally; **CI** uses Node **24** (GitHub Actions).
- **npm**

## Setup

```bash
git clone https://github.com/nmarchand73/pitboard.git
cd pitboard
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (default: `http://localhost:5173`) |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Serve `dist/` locally (port shown in terminal) |

For a **production build** that matches GitHub Pages (base path `/<repo>/`), run:

```bash
VITE_BASE_URL=/pitboard/ npm run build
npm run preview
```

Then open the URL Vite prints with the `/pitboard/` path (e.g. `http://localhost:4173/pitboard/`).

The `devDependencies` `@emnapi/core` and `@emnapi/runtime` are pinned so **`npm ci`** stays consistent on Linux CI (they satisfy peer dependencies pulled in by the Vite / Rolldown toolchain).

## GitHub Pages

Deployments run via [`.github/workflows/pages.yml`](.github/workflows/pages.yml) on every push to `main`.

1. In the GitHub repo: **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions** (not “Deploy from a branch”).
2. After the first successful workflow run, the site is available at `https://<user>.github.io/<repo>/` (this project: [nmarchand73.github.io/pitboard](https://nmarchand73.github.io/pitboard/)).

## Static assets (manuals)

Place OEM PDF files under `public/manuals/` as referenced by each bike’s JSON (`manualFile`), for example:

- `public/manuals/ktm-85-sx-2022.pdf`
- `public/manuals/yz-125-2007.pdf`

## Data model

- **Bike list (order in UI):** `src/data/bike-index.json` (`bikes`: array of ids).
- **Bike definition:** `src/data/bikes/<id>.json`:
  - `intervals[]` — column ids and labels.
  - `tasks[]` — `title`, optional `page` (see `pageOffset` below), `cells` map (`none` / `once` / `periodic`), optional **`remarks`** (shown in a **Remarques** column when any visible task has non-empty text).
  - **`pageOffset`** (optional): added to `task.page` when opening the PDF (e.g. KTM uses printed manual page in data; YZ uses **PDF page index** with `0`).
  - **`carnetColumns`** (optional): `{ obligatoire, recommandé }` arrays of interval ids per table section. If omitted, the default is the KTM-style hour grid.
  - **`carnetRecommendedBadge`** (optional): short label before “Travaux recommandés” (e.g. `"9.3"` for KTM). Omit for no badge.

**Runtime registry:** import the JSON in `src/main.ts` and add it to `bikeRegistry` under the same `id` as in `bike-index.json`.

### Adding a new model

1. Add the PDF under `public/manuals/<slug>.pdf`.
2. Copy `src/data/bikes/yz-125-2007.json` or `ktm-85-sx-2022.json` as a template; set `id`, `label`, `manualFile`, intervals, tasks, and optional `carnetColumns` / `remarks` / `pageOffset`.
3. Append the `id` to `src/data/bike-index.json`.
4. Register the document in `src/main.ts` (`bikeRegistry`).

## Stack

- **Vite 8** + **TypeScript**
- **PDF.js** (`pdfjs-dist`) for the full-screen PDF viewer

## License

### This project (Pitboard)

Application source code in this repository is licensed under the **MIT License** — see [`LICENSE`](LICENSE).

### Third-party open-source components

Bundled or used at build time:

| Component | License | Role |
|-----------|---------|------|
| [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) ([Mozilla PDF.js](https://github.com/mozilla/pdf.js)) | [Apache License 2.0](https://github.com/mozilla/pdf.js/blob/master/LICENSE) | PDF rendering |
| [Vite](https://vitejs.dev/) | [MIT](https://github.com/vitejs/vite/blob/main/LICENSE) | Build tool & dev server |
| [TypeScript](https://www.typescriptlang.org/) | [Apache License 2.0](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt) | Language & compiler |

Full third-party license texts are available in `node_modules/<package>/` after `npm install`.

### Manufacturer PDFs and data

Factory manuals, diagrams, and maintenance tables shipped with vehicles remain **property of their respective manufacturers** and are subject to their copyright and terms of use. Pitboard is a **viewer and layout tool** only; it does not grant any right to redistribute OEM documents beyond what you are already allowed to do under local law and OEM policy.
