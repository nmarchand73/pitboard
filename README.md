# Pitboard

Application web pour consulter le **carnet d’entretien constructeur** (grille par périodes, comme dans le manuel papier), filtrer par colonne et ouvrir le **PDF** du manuel à la page indiquée — pensée atelier / mobile.

## Prérequis

- Node.js 20+ (recommandé)
- npm

## Installation et commandes

```powershell
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # sortie dans dist/
npm run preview  # sert dist/ (port affiché dans le terminal)
```

## Contenu statique

Les fichiers du **manuel** doivent être servis depuis `public/`, par exemple :

`public/manuals/ktm-85-sx-2022.pdf`

Les chemins sont définis dans les JSON des motos (`src/data/bikes/*.json`, champ `manualFile`).

## Données et motos

- Registre : `src/data/bike-index.json`
- Fiche modèle : `src/data/bikes/<id>.json` (intervalles, tâches, pastilles ○ / ● par colonne)

Pour ajouter une moto : dupliquer une fiche existante, ajuster l’`id`, enregistrer le PDF sous `public/manuals/`, puis référencer la moto dans `bike-index.json`.

## Détails techniques

- **Vite 8** + **TypeScript**
- **pdf.js** (`pdfjs-dist`) pour la visionneuse plein écran

## Licence

Projet privé — à adapter selon ton dépôt.
