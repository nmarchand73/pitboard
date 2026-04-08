import type { BikeDoc, CellValue, MaintenanceTask } from './types'
import { pdfStartPage } from './pdf-page'

const COLS_OBLIGATOIRE = ['h10', 'h20', 'h40', 'race'] as const
const COLS_RECOMMANDE = ['h10', 'h20', 'h40', 'race', 'm12', 'm48'] as const

function getCarnetColumnIds(bike: BikeDoc, category: 'obligatoire' | 'recommandé'): readonly string[] {
  if (bike.carnetColumns) {
    return bike.carnetColumns[category]
  }
  return category === 'obligatoire' ? COLS_OBLIGATOIRE : COLS_RECOMMANDE
}

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function intervalLabel(bike: BikeDoc, id: string): string {
  return bike.intervals.find((i) => i.id === id)?.label ?? id
}

/** Libellé court pour aria (en-tête colonne → filtre guide) */
function shortIntervalAriaLabel(bike: BikeDoc, id: string): string {
  const iv = bike.intervals.find((i) => i.id === id)
  if (!iv) return id
  if (iv.id === 'h10') return '10 h'
  if (iv.id === 'h20') return '20 h'
  if (iv.id === 'h40') return '40 h'
  if (iv.id === 'race') return 'après chaque course'
  if (iv.id === 'm12') return '12 mois'
  if (iv.id === 'm48') return '48 mois'
  if (iv.id === 'rodage') return 'après rodage'
  if (iv.id === 'race3') return 'chaque 3e course'
  if (iv.id === 'race5') return 'chaque 5e course'
  if (iv.id === 'need') return 'si nécessaire'
  return iv.label
}

function taskRowMatchesIntervalFilter(task: MaintenanceTask, intervalFilterId: string | 'tous'): boolean {
  if (intervalFilterId === 'tous') return true
  const c = task.cells[intervalFilterId]
  return c !== undefined && c !== 'none'
}

function cellSymbol(v: CellValue): string {
  if (v === 'once')
    return '<span class="carnet-m" aria-label="Intervalle unique, cercle vide"><span class="carnet-pastille carnet-pastille--once" aria-hidden="true"></span></span>'
  if (v === 'periodic')
    return '<span class="carnet-m" aria-label="Intervalle périodique, point plein"><span class="carnet-pastille carnet-pastille--period" aria-hidden="true"></span></span>'
  return '<span class="carnet-m carnet-m--empty" aria-hidden="true"></span>'
}

function taskRemarksText(task: MaintenanceTask): string {
  const r = task.remarks?.trim()
  return r ?? ''
}

function taskRowCell(bike: BikeDoc, task: MaintenanceTask): string {
  const wrench = task.requiresSpecialTools
    ? '<span class="carnet-wrench-inline" title="Outillage spécifique ou point atelier" aria-hidden="true">🔧</span>'
    : ''
  const manualHint =
    task.page != null
      ? `<span class="carnet-manual-paren" aria-hidden="true">(<span class="carnet-ref-inline__book">📖</span> p. ${task.page})</span>`
      : ''

  const line = `<span class="carnet-taskcell__line"><span class="carnet-taskcell__txt">${esc(task.title)}</span>${wrench}${manualHint}</span>`

  const rm = taskRemarksText(task)
  const ariaBase = `Ouvrir le manuel — ${task.title} (page ${task.page})${rm ? ` — Remarque : ${rm}` : ''}`

  if (task.page != null) {
    const start = pdfStartPage(bike, task.page)
    return `<button type="button" class="carnet-taskcell carnet-taskcell--manual" data-open-manual data-manual-path="${esc(bike.manualFile)}" data-start-page="${start}" data-context-title="${esc(task.title)}" aria-label="${esc(ariaBase)}">${line}</button>`
  }

  return `<div class="carnet-taskcell">${line}</div>`
}

function taskRemarksTableCell(task: MaintenanceTask): string {
  const rm = taskRemarksText(task)
  const inner = rm ? `<p class="carnet-remarks__txt">${esc(rm)}</p>` : '<span class="carnet-remarks__empty" aria-hidden="true">—</span>'
  return `<td class="carnet-table__remarks">${inner}</td>`
}

/**
 * Tableau type manuel : barre de titre, grille, en-têtes en escalier, zébrage, légende.
 */
export function buildCarnetSectionHtml(
  bike: BikeDoc,
  category: 'obligatoire' | 'recommandé',
  intervalFilterId: string | 'tous' = 'tous',
): string {
  const colIds = getCarnetColumnIds(bike, category)
  const tasks = bike.tasks.filter(
    (t) => t.category === category && taskRowMatchesIntervalFilter(t, intervalFilterId),
  )
  if (tasks.length === 0) return ''

  const includeRemarks = tasks.some((t) => taskRemarksText(t) !== '')

  const headCells = colIds
    .map((id, i) => {
      const full = intervalLabel(bike, id)
      const shortAria = shortIntervalAriaLabel(bike, id)
      const active = intervalFilterId !== 'tous' && intervalFilterId === id
      const title = active
        ? 'Afficher toutes les périodes (clic à nouveau)'
        : `N’afficher que les travaux pour ${full}`
      const ariaPressed = active ? 'true' : 'false'
      return `<th scope="col" class="carnet-table__int carnet-table__int--b${i % 2}">
        <button type="button" class="carnet-th__hit${active ? ' is-active' : ''}" data-go-interval="${esc(id)}"
          title="${esc(title)}"
          aria-pressed="${ariaPressed}"
          aria-label="Filtrer le carnet sur ${esc(shortAria)}">
          <div class="carnet-th__inner carnet-th__inner--s${i}">
            <span class="carnet-th__lab" title="${esc(full)}">${esc(full)}</span>
          </div>
        </button>
      </th>`
    })
    .join('')

  const remarksHead = includeRemarks
    ? `<th scope="col" class="carnet-table__remarks-h">
        <span class="carnet-table__remarks-h-txt" title="Indications du manuel (lubrifiants, jeux, renvois…)">Remarques</span>
      </th>`
    : ''

  const bodyRows = tasks
    .map((task) => {
      const syms = colIds
        .map((id, colIdx) => {
          const v = task.cells[id] ?? 'none'
          return `<td class="carnet-table__sym carnet-table__sym--b${colIdx % 2}">${cellSymbol(v)}</td>`
        })
        .join('')
      const remarksTd = includeRemarks ? taskRemarksTableCell(task) : ''
      return `<tr class="carnet-table__row">
        <th scope="row" class="carnet-table__task">${taskRowCell(bike, task)}</th>
        ${syms}
        ${remarksTd}
      </tr>`
    })
    .join('')

  const isOb = category === 'obligatoire'
  const sectionId = isOb ? 'carnet-ob-title' : 'carnet-rec-title'
  const badge =
    bike.carnetRecommendedBadge != null && bike.carnetRecommendedBadge !== ''
      ? `<span class="carnet-panel__bar-num">${esc(bike.carnetRecommendedBadge)}</span>`
      : ''
  const bar = isOb
    ? `<div class="carnet-panel__bar" id="${sectionId}"><span class="carnet-panel__bar-text">Travaux obligatoires</span></div>`
    : `<div class="carnet-panel__bar carnet-panel__bar--accent" id="${sectionId}">${badge}<span class="carnet-panel__bar-text">Travaux recommandés</span></div>`

  const ariaLabel = isOb ? 'Tableau des travaux obligatoires' : 'Tableau des travaux recommandés'
  const colgroup = `<colgroup>
    <col class="carnet-col-task" />
    ${colIds.map(() => '<col class="carnet-col-int" />').join('')}
    ${includeRemarks ? '<col class="carnet-col-remarks" />' : ''}
  </colgroup>`

  const panelMod = isOb ? ' carnet-panel--ob' : ' carnet-panel--rec'
  return `
    <section class="carnet-panel${panelMod}" aria-labelledby="${sectionId}">
      ${bar}
      <div class="carnet-panel__sheet carnet-panel__sheet--table" tabindex="0" role="region" aria-label="${ariaLabel}, défilement horizontal possible">
        <table class="carnet-table ${isOb ? 'carnet-table--ob' : 'carnet-table--rec'}" aria-label="${ariaLabel}">
          ${colgroup}
          <thead>
            <tr>
              <th scope="col" class="carnet-table__corner">
                <span class="carnet-table__corner-txt">Travaux à effectuer</span>
              </th>
              ${headCells}
              ${remarksHead}
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </div>
      <p class="carnet-panel__legend">
        <strong>Légende :</strong>
        <span class="carnet-sym">○</span> intervalle unique ·
        <span class="carnet-sym">●</span> intervalle périodique
        <span class="carnet-panel__legend-tools"> · <span class="carnet-wrench" aria-hidden="true">🔧</span> outillage / atelier</span>
        ${
          includeRemarks
            ? '<span class="carnet-panel__legend-remarks"> · Colonne <strong>Remarques</strong> : lubrifiants, jeux, renvois et précisions du constructeur.</span>'
            : ''
        }
      </p>
    </section>
  `
}

export function buildCarnetPanelsHtml(bike: BikeDoc, intervalFilterId: string | 'tous' = 'tous'): string {
  const ob = buildCarnetSectionHtml(bike, 'obligatoire', intervalFilterId)
  const re = buildCarnetSectionHtml(bike, 'recommandé', intervalFilterId)
  if (!ob && !re) {
    if (intervalFilterId !== 'tous') {
      const lab = intervalLabel(bike, intervalFilterId)
      return `<div class="carnet-empty" role="status">
        <p>Aucun travail prévu à <strong>${esc(lab)}</strong> pour <strong>${esc(bike.label)}</strong>.</p>
        <p class="carnet-empty__hint">Réessayez une autre colonne ou affichez <strong>toutes les périodes</strong>.</p>
      </div>`
    }
    return `<div class="carnet-empty" role="status">
      <p>Aucune tâche d’entretien dans les données pour <strong>${esc(bike.label)}</strong>.</p>
    </div>`
  }
  return ob + re
}
