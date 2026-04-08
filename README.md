# Pitboard

Web app for reading the **manufacturer maintenance schedule** as an interactive grid (same structure as the paper service booklet), filtering by interval column, and opening the **factory manual PDF** at the listed page. Built for workshop and mobile use.

**Repository:** [github.com/nmarchand73/pitboard](https://github.com/nmarchand73/pitboard)

## Prerequisites

- **Node.js** 20+ recommended  
- **npm**

## Setup

```bash
git clone https://github.com/nmarchand73/pitboard.git
cd pitboard
npm install
```

## Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Dev server (default: `http://localhost:5173`)   |
| `npm run build`   | Type-check + production build → `dist/`          |
| `npm run preview` | Serve `dist/` locally (port shown in terminal)   |

## Static assets (manuals)

Place OEM PDF files under `public/` as referenced by each bike’s data, for example:

`public/manuals/ktm-85-sx-2022.pdf`

Paths are set in `src/data/bikes/*.json` (`manualFile` field).

## Data model

- **Bike registry:** `src/data/bike-index.json`
- **Bike definition:** `src/data/bikes/<id>.json` — intervals, tasks, and cell markers (○ / ●) per column

To add a model: copy an existing JSON, set a unique `id`, add the PDF under `public/manuals/`, and register the bike in `bike-index.json`.

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
