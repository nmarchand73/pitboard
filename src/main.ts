import './style.css'
import { buildCarnetPanelsHtml } from './carnet-dynamic'
import { openPdfModal } from './pdf-modal'
import { pdfStartPage } from './pdf-page'
import type { BikeBrand, BikeDoc, IntervalDef } from './types'
import bikeIndex from './data/bike-index.json'
import ktm852022 from './data/bikes/ktm-85-sx-2022.json'
import yz1252007 from './data/bikes/yz-125-2007.json'
import triumphTigerXcr2019 from './data/bikes/triumph-tiger-xcr-2019.json'
import riejuMrt50SmTrophy2024 from './data/bikes/rieju-mrt50-sm-trophy-2024.json'

const bikeRegistry: Record<string, BikeDoc> = {
  'ktm-85-sx-2022': ktm852022 as BikeDoc,
  'yz-125-2007': yz1252007 as BikeDoc,
  'triumph-tiger-xcr-2019': triumphTigerXcr2019 as BikeDoc,
  'rieju-mrt50-sm-trophy-2024': riejuMrt50SmTrophy2024 as BikeDoc,
}

const root = document.querySelector<HTMLDivElement>('#app')!

let selectedBikeId = bikeIndex.bikes[0] ?? ''
let intervalFilterId: string | 'tous' = 'tous'

function getBike(): BikeDoc {
  const bike = bikeRegistry[selectedBikeId]
  if (!bike) throw new Error(`Moto inconnue : ${selectedBikeId}`)
  return bike
}

function shortIntervalLabel(iv: IntervalDef): string {
  if (iv.id === 'h10') return '10 h'
  if (iv.id === 'h20') return '20 h'
  if (iv.id === 'h40') return '40 h'
  if (iv.id === 'race') return 'Après course'
  if (iv.id === 'm12') return '12 mois'
  if (iv.id === 'm48') return '48 mois'
  if (iv.id === 'rodage') return 'Après rodage'
  if (iv.id === 'race3') return '3e course'
  if (iv.id === 'race5') return '5e course'
  if (iv.id === 'need') return 'Si nécessaire'
  if (iv.id === 'jour') return 'Chaque jour'
  if (iv.id === 'rev800') return '800 km / 1 mois'
  if (iv.id === 'year') return 'Annuel'
  if (iv.id === 'km1030') return '10k / 30k'
  if (iv.id === 'km20') return '20k'
  if (iv.id === 'km40') return '40k'
  if (iv.id === 'km1000') return '1 000 km'
  if (iv.id === 'km4000') return '4 000 km'
  if (iv.id === 'km7000') return '7 000 km'
  if (iv.id === 'km10000') return '10 000 km'
  if (iv.id === 'kmPlus3000') return '+3 000 km'
  return iv.label
}

function intervalFilterShortLabel(bike: BikeDoc): string {
  if (intervalFilterId === 'tous') return ''
  const iv = bike.intervals.find((i) => i.id === intervalFilterId)
  return iv ? shortIntervalLabel(iv) : intervalFilterId
}

const BRAND_MONOGRAM: Record<BikeBrand, string> = {
  ktm: 'KTM',
  yamaha: 'Yamaha',
  triumph: 'Triumph',
  rieju: 'Rieju',
}

function bikeBrandMonogram(brand: BikeBrand): string {
  return BRAND_MONOGRAM[brand]
}

/** Libellé modèle sans répéter la marque sur la 2e ligne de la pastille. */
function bikeModelLine(label: string, brand: BikeBrand): string {
  if (brand === 'ktm') return label.replace(/^KTM\s+/i, '').trim()
  if (brand === 'triumph') return label.replace(/^Triumph\s+/i, '').trim()
  if (brand === 'rieju') return label.replace(/^Rieju\s+/i, '').trim()
  return label.replace(/^Yamaha\s+/i, '').trim()
}

function buildHeroManualButtons(bike: BikeDoc): string {
  const primaryLabel =
    bike.extraManuals && bike.extraManuals.length > 0
      ? (bike.manualPrimaryLabel ?? 'Manuel propriétaire')
      : (bike.manualPrimaryLabel ?? 'Ouvrir le manuel (PDF)')

  const buttons: string[] = [
    `<button type="button" class="btn btn--ghost carnet-hero__manual-btn" data-root-manual-open data-manual-path="${escapeHtml(bike.manualFile)}" aria-label="${escapeHtml(primaryLabel)}">${escapeHtml(primaryLabel)}</button>`,
  ]
  for (const ex of bike.extraManuals ?? []) {
    buttons.push(
      `<button type="button" class="btn btn--ghost carnet-hero__manual-btn" data-root-manual-open data-manual-path="${escapeHtml(ex.path)}" aria-label="Ouvrir ${escapeHtml(ex.label)}">${escapeHtml(ex.label)}</button>`,
    )
  }
  if (buttons.length === 1) {
    return `<p class="carnet-hero__manual">${buttons[0]}</p>`
  }
  return `<div class="carnet-hero__manuals" role="group" aria-label="Manuels PDF">${buttons.join('')}</div>`
}

/** Ancien lien #guide : on reste sur le carnet. */
function stripGuideHashFromUrl(): void {
  const raw = window.location.hash.replace(/^#/, '')
  if (!raw) return
  const first = raw.split('&')[0]
  if (first === 'guide') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

function render(): void {
  const bike = getBike()
  root.innerHTML = `
    <div class="shell shell--carnet">
      <a href="#carnet-main" class="skip-link">Aller aux tableaux</a>

      <header class="carnet-hero">
        <p class="carnet-hero__brand">Pitboard</p>
        <h1 class="carnet-hero__title">Entretien par période</h1>
        ${buildHeroManualButtons(bike)}
        <div class="carnet-hero__pick">
          <p id="bike-pills-label" class="field__label">Moto</p>
          <div
            class="carnet-bike-pills"
            role="radiogroup"
            aria-labelledby="bike-pills-label"
          >
            ${bikeIndex.bikes
              .map((id) => {
                const b = bikeRegistry[id]
                const label = b?.label ?? id
                const brand: BikeBrand = b?.brand ?? 'ktm'
                const checked = id === selectedBikeId
                const mono = bikeBrandMonogram(brand)
                const modelLine = bikeModelLine(label, brand)
                return `<label class="carnet-bike-pill" data-brand="${brand}">
                  <input
                    type="radio"
                    name="bike-front"
                    value="${escapeHtml(id)}"
                    class="sr-only"
                    ${checked ? 'checked' : ''}
                  />
                  <span class="carnet-bike-pill__inner">
                    <span class="carnet-bike-pill__swatch" aria-hidden="true"></span>
                    <span class="carnet-bike-pill__copy">
                      <span class="carnet-bike-pill__mono">${escapeHtml(mono)}</span>
                      <span class="carnet-bike-pill__text">${escapeHtml(modelLine)}</span>
                    </span>
                  </span>
                </label>`
              })
              .join('')}
          </div>
        </div>
      </header>

      ${
        intervalFilterId !== 'tous'
          ? `
      <div class="carnet-filter-bar" role="region" aria-label="Filtre période sur le carnet">
        <p class="carnet-filter-bar__txt">
          Affichage : <strong>${escapeHtml(intervalFilterShortLabel(bike))}</strong>
          <span class="carnet-filter-bar__hint">${
            bike.brand === 'triumph'
              ? ' — uniquement les lignes avec •, « jour » ou une note sur cette colonne'
              : bike.brand === 'rieju'
                ? ' — uniquement les lignes avec symbole ou texte sur cette colonne (I, C, E, L, combinaisons…)'
                : ' — uniquement les lignes avec ○ ou ● sur cette colonne'
          }</span>
        </p>
        <button type="button" class="btn btn--ghost" id="carnet-clear-interval">
          Toutes les périodes
        </button>
      </div>`
          : ''
      }

      <div id="carnet-main" class="carnet-panels">
        ${buildCarnetPanelsHtml(bike, intervalFilterId)}
      </div>
    </div>
  `

  root.querySelectorAll<HTMLInputElement>('input[name="bike-front"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return
      selectedBikeId = radio.value
      intervalFilterId = 'tous'
      render()
    })
  })

  root.querySelectorAll<HTMLButtonElement>('[data-root-manual-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const path = btn.getAttribute('data-manual-path')
      if (!path) return
      openPdfModal(path, pdfStartPage(bike, 1), bike.label)
    })
  })

  document.getElementById('carnet-clear-interval')?.addEventListener('click', () => {
    intervalFilterId = 'tous'
    render()
  })
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

document.body.addEventListener('click', (e) => {
  const goInterval = (e.target as HTMLElement).closest('[data-go-interval]')
  if (goInterval) {
    e.preventDefault()
    const id = (goInterval as HTMLElement).dataset.goInterval
    if (!id) return
    intervalFilterId = intervalFilterId === id ? 'tous' : id
    render()
    return
  }
  const btn = (e.target as HTMLElement).closest('[data-open-manual]')
  if (!btn) return
  e.preventDefault()
  const path = btn.getAttribute('data-manual-path')
  const p = parseInt(btn.getAttribute('data-start-page') || '1', 10)
  const contextTitle = btn.getAttribute('data-context-title')
  if (path) openPdfModal(path, Number.isFinite(p) ? p : 1, contextTitle)
})

window.addEventListener('hashchange', () => {
  stripGuideHashFromUrl()
  render()
})

stripGuideHashFromUrl()
render()