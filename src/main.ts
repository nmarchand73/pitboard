import './style.css'
import { buildCarnetPanelsHtml } from './carnet-dynamic'
import { openPdfModal } from './pdf-modal'
import type { BikeDoc, IntervalDef } from './types'
import bikeIndex from './data/bike-index.json'
import ktm852022 from './data/bikes/ktm-85-sx-2022.json'

const bikeRegistry: Record<string, BikeDoc> = {
  'ktm-85-sx-2022': ktm852022 as BikeDoc,
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
  return iv.label
}

function intervalFilterShortLabel(bike: BikeDoc): string {
  if (intervalFilterId === 'tous') return ''
  const iv = bike.intervals.find((i) => i.id === intervalFilterId)
  return iv ? shortIntervalLabel(iv) : intervalFilterId
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
        <div class="carnet-hero__pick">
          <label class="field__label" for="bike-select-front">Moto</label>
          <select id="bike-select-front" class="select select--carnet" autocomplete="off">
            ${bikeIndex.bikes
              .map((id) => {
                const b = bikeRegistry[id]
                const label = b?.label ?? id
                return `<option value="${id}" ${id === selectedBikeId ? 'selected' : ''}>${escapeHtml(label)}</option>`
              })
              .join('')}
          </select>
        </div>
      </header>

      ${
        intervalFilterId !== 'tous'
          ? `
      <div class="carnet-filter-bar" role="region" aria-label="Filtre période sur le carnet">
        <p class="carnet-filter-bar__txt">
          Affichage : <strong>${escapeHtml(intervalFilterShortLabel(bike))}</strong>
          <span class="carnet-filter-bar__hint"> — uniquement les lignes avec ○ ou ● sur cette colonne</span>
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

  document.getElementById('bike-select-front')?.addEventListener('change', (e) => {
    selectedBikeId = (e.target as HTMLSelectElement).value
    intervalFilterId = 'tous'
    render()
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