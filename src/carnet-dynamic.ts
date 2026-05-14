import type { BikeDoc, CellValue, MaintenanceTask } from './types'
import { isCellTextNote } from './types'
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

function intervalHeaderSub(bike: BikeDoc, id: string): string | undefined {
  return bike.intervals.find((i) => i.id === id)?.headerSub
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
  if (iv.id === 'jour') return 'chaque jour'
  if (iv.id === 'rev800') return '800 km ou 1 mois'
  if (iv.id === 'year') return 'entretien annuel'
  if (iv.id === 'km1030') return '10 000 et 30 000 km'
  if (iv.id === 'km20') return '20 000 km'
  if (iv.id === 'km40') return '40 000 km'
  if (iv.id === 'km1000') return '1 000 km'
  if (iv.id === 'km4000') return '4 000 km'
  if (iv.id === 'km7000') return '7 000 km'
  if (iv.id === 'km10000') return '10 000 km'
  if (iv.id === 'kmPlus3000') return 'puis +3 000 km'
  return iv.label
}

function getCell(task: MaintenanceTask, colId: string): CellValue {
  return task.cells[colId] ?? 'none'
}

/** Colonne prise en compte pour le filtre période : « actif » si intervention ou contrôle journalier ou note. */
function cellIsActiveForFilter(v: CellValue): boolean {
  if (isCellTextNote(v)) return v.value.trim() !== ''
  if (v === 'none' || v === 'dash') return false
  return true
}

function taskRowMatchesIntervalFilter(
  task: MaintenanceTask,
  intervalFilterId: string | 'tous',
): boolean {
  if (intervalFilterId === 'tous') return true
  if (task.intervalSpanText) return true
  const c = getCell(task, intervalFilterId)
  return cellIsActiveForFilter(c)
}

function cellHtml(bike: BikeDoc, v: CellValue): string {
  if (isCellTextNote(v)) {
    const cls = bike.brand === 'rieju' ? ' carnet-cell-text--rieju' : ''
    return `<span class="carnet-cell-text${cls}" role="text">${esc(v.value)}</span>`
  }
  if (v === 'once')
    return '<span class="carnet-m" aria-label="Intervalle unique, cercle vide"><span class="carnet-pastille carnet-pastille--once" aria-hidden="true"></span></span>'
  if (v === 'periodic') {
    if (bike.brand === 'triumph') {
      return '<span class="carnet-m" aria-label="Intervention à prévoir (point du manuel)"><span class="carnet-sym-bullet" aria-hidden="true">•</span></span>'
    }
    return '<span class="carnet-m" aria-label="Intervention à prévoir (point)"><span class="carnet-pastille carnet-pastille--period" aria-hidden="true"></span></span>'
  }
  if (v === 'dash')
    return '<span class="carnet-m carnet-m--dash" aria-label="Pas d’intervention">—</span>'
  if (v === 'daily')
    return '<span class="carnet-m carnet-m--daily" aria-label="Contrôle journalier">jour</span>'
  return '<span class="carnet-m carnet-m--empty" aria-hidden="true"></span>'
}

function taskRemarksText(task: MaintenanceTask): string {
  const r = task.remarks?.trim()
  return r ?? ''
}

/** Chemins + pages effectifs pour les liens manuel (priorité à `manualRefs`). */
function taskManualRefs(
  bike: BikeDoc,
  task: MaintenanceTask,
): { path: string; page: number; shortLabel?: string }[] {
  const mr = task.manualRefs
  if (mr && mr.length > 0) {
    return mr.map((r) => ({
      path: r.manualPath ?? bike.manualFile,
      page: r.page,
      shortLabel: r.shortLabel,
    }))
  }
  if (task.page != null) {
    return [{ path: task.manualPath ?? bike.manualFile, page: task.page }]
  }
  return []
}

function taskRowCell(bike: BikeDoc, task: MaintenanceTask): string {
  const wrench = task.requiresSpecialTools
    ? '<span class="carnet-wrench-inline" title="Outillage spécifique ou point atelier" aria-hidden="true">🔧</span>'
    : ''
  const refs = taskManualRefs(bike, task)
  const rm = taskRemarksText(task)

  if (refs.length === 0) {
    const line = `<span class="carnet-taskcell__line"><span class="carnet-taskcell__txt">${esc(task.title)}</span>${wrench}</span>`
    return `<div class="carnet-taskcell">${line}</div>`
  }

  if (refs.length === 1) {
    const r = refs[0]
    const manualHint = `<span class="carnet-manual-paren" aria-hidden="true">(<span class="carnet-ref-inline__book">📖</span> p. ${r.page})</span>`
    const line = `<span class="carnet-taskcell__line"><span class="carnet-taskcell__txt">${esc(task.title)}</span>${wrench}${manualHint}</span>`
    const start = pdfStartPage(bike, r.page)
    const ariaBase = `Ouvrir le manuel — ${task.title} (page ${r.page})${rm ? ` — Remarque : ${rm}` : ''}`
    return `<button type="button" class="carnet-taskcell carnet-taskcell--manual" data-open-manual data-manual-path="${esc(r.path)}" data-start-page="${start}" data-context-title="${esc(task.title)}" aria-label="${esc(ariaBase)}">${line}</button>`
  }

  const line = `<span class="carnet-taskcell__line"><span class="carnet-taskcell__txt">${esc(task.title)}</span>${wrench}</span>`
  const groupAria = `Manuels PDF — ${task.title}${rm ? ` — Remarque : ${rm}` : ''}`
  const buttons = refs
    .map((r) => {
      const start = pdfStartPage(bike, r.page)
      const lab = r.shortLabel ? `${r.shortLabel}, p. ${r.page}` : `p. ${r.page}`
      const inner = `(<span class="carnet-ref-inline__book" aria-hidden="true">📖</span> ${esc(lab)})`
      const aria = `Ouvrir le PDF — ${task.title} — ${lab}`
      return `<button type="button" class="carnet-manual-refbtn" data-open-manual data-manual-path="${esc(r.path)}" data-start-page="${start}" data-context-title="${esc(task.title)}" aria-label="${esc(aria)}">${inner}</button>`
    })
    .join('')

  return `<div class="carnet-taskcell carnet-taskcell--manual-mult" role="group" aria-label="${esc(groupAria)}">
    ${line}
    <span class="carnet-manual-refs">${buttons}</span>
  </div>`
}

function taskRemarksTableCell(task: MaintenanceTask): string {
  const rm = taskRemarksText(task)
  const inner = rm ? `<p class="carnet-remarks__txt">${esc(rm)}</p>` : '<span class="carnet-remarks__empty" aria-hidden="true">—</span>'
  return `<td class="carnet-table__remarks">${inner}</td>`
}

function sectionRowHtml(title: string, colSpan: number): string {
  return `<tr class="carnet-table__section" aria-hidden="false">
    <th scope="colgroup" class="carnet-table__section-th" colspan="${colSpan}">${esc(title)}</th>
  </tr>`
}

function defaultLegendHtml(includeRemarks: boolean): string {
  return `<p class="carnet-panel__legend">
        <strong>Légende :</strong>
        <span class="carnet-sym">○</span> intervalle unique ·
        <span class="carnet-sym">●</span> intervalle périodique
        <span class="carnet-panel__legend-tools"> · <span class="carnet-wrench" aria-hidden="true">🔧</span> outillage / atelier</span>
        ${
          includeRemarks
            ? '<span class="carnet-panel__legend-remarks"> · Colonne <strong>Remarques</strong> : lubrifiants, jeux, renvois et précisions du constructeur.</span>'
            : ''
        }
      </p>`
}

function triumphLegendHtml(includeRemarks: boolean): string {
  const lines = [
    '<strong>Légende (manuel constructeur) :</strong>',
    '<span class="carnet-sym">•</span> intervention à prévoir ·',
    '<span class="carnet-sym">—</span> pas d’intervention à cette échéance ·',
    '« <span class="carnet-m carnet-m--daily">jour</span> » contrôle à chaque utilisation (journalier).',
    '<span class="carnet-panel__legend-tools"> · <span class="carnet-wrench" aria-hidden="true">🔧</span> outillage / atelier</span>',
  ]
  if (includeRemarks) {
    lines.push(
      '<span class="carnet-panel__legend-remarks"> · Colonne <strong>Remarques</strong> : précisions du constructeur.</span>',
    )
  }
  return `<p class="carnet-panel__legend carnet-panel__legend--triumph">${lines.join(' ')}</p>`
}

function riejuLegendHtml(includeRemarks: boolean): string {
  const lines = [
    '<strong>Légende (manuel constructeur) :</strong>',
    '<span class="carnet-sym">I</span> inspecter / réajuster ·',
    '<span class="carnet-sym">C</span> remplacer ·',
    '<span class="carnet-sym">E</span> graisser ·',
    '<span class="carnet-sym">L</span> nettoyer.',
    'Les combinaisons (ex. <span class="carnet-sym">L/E</span>, <span class="carnet-sym">I/E</span>) reprennent le tableau d’origine.',
    '<span class="carnet-panel__legend-tools"> · <span class="carnet-wrench" aria-hidden="true">🔧</span> outillage / atelier</span>',
  ]
  if (includeRemarks) {
    lines.push(
      '<span class="carnet-panel__legend-remarks"> · Colonne <strong>Remarques</strong> : précisions du constructeur.</span>',
    )
  }
  return `<p class="carnet-panel__legend carnet-panel__legend--rieju">${lines.join(' ')}</p>`
}

function legendBlockHtml(bike: BikeDoc, includeRemarks: boolean): string {
  if (bike.carnetLegendLines && bike.carnetLegendLines.length > 0) {
    return `<p class="carnet-panel__legend">${bike.carnetLegendLines.map((l) => esc(l)).join(' ')}</p>`
  }
  if (bike.brand === 'triumph') return triumphLegendHtml(includeRemarks)
  if (bike.brand === 'rieju') return riejuLegendHtml(includeRemarks)
  return defaultLegendHtml(includeRemarks)
}

function footnotesBlockHtml(bike: BikeDoc): string {
  const notes = bike.carnetFootnotes
  if (!notes || notes.length === 0) return ''
  const items = notes.map((n) => `<li class="carnet-footnotes__item">${esc(n)}</li>`).join('')
  return `<ul class="carnet-footnotes">${items}</ul>`
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
      const sub = intervalHeaderSub(bike, id)
      const labHtml = sub
        ? `<span class="carnet-th__lab" title="${esc(`${full} — ${sub}`)}">${esc(full)}<span class="carnet-th__sub">${esc(sub)}</span></span>`
        : `<span class="carnet-th__lab" title="${esc(full)}">${esc(full)}</span>`
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
          <div class="carnet-th__inner">
            ${labHtml}
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

  const cornerLabel = bike.carnetCornerLabel?.trim() || 'Travaux à effectuer'

  const bodyParts: string[] = []
  const sectionColSpan = 1 + colIds.length + (includeRemarks ? 1 : 0)
  let zebra = 0

  for (const task of tasks) {
    if (task.sectionTitle) {
      bodyParts.push(sectionRowHtml(task.sectionTitle, sectionColSpan))
    }

    const remarksTd = includeRemarks ? taskRemarksTableCell(task) : ''
    const ze = zebra % 2 === 0 ? 'even' : 'odd'
    zebra += 1

    if (task.intervalSpanText) {
      const spanCols = colIds.length
      bodyParts.push(`<tr class="carnet-table__row carnet-table__row--span carnet-table__row--ze-${ze}">
        <th scope="row" class="carnet-table__task">${taskRowCell(bike, task)}</th>
        <td class="carnet-table__span" colspan="${spanCols}">${esc(task.intervalSpanText)}</td>
        ${remarksTd}
      </tr>`)
      continue
    }

    const syms = colIds
      .map((id, colIdx) => {
        const v = getCell(task, id)
        return `<td class="carnet-table__sym carnet-table__sym--b${colIdx % 2}">${cellHtml(bike, v)}</td>`
      })
      .join('')

    bodyParts.push(`<tr class="carnet-table__row carnet-table__row--ze-${ze}">
        <th scope="row" class="carnet-table__task">${taskRowCell(bike, task)}</th>
        ${syms}
        ${remarksTd}
      </tr>`)
  }

  const bodyRows = bodyParts.join('')

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
        <div class="carnet-table-scroll">
          <table class="carnet-table ${isOb ? 'carnet-table--ob' : 'carnet-table--rec'} carnet-table--brand-${bike.brand}" aria-label="${ariaLabel}">
            ${colgroup}
            <thead>
              <tr>
                <th scope="col" class="carnet-table__corner">
                  <span class="carnet-table__corner-txt">${esc(cornerLabel)}</span>
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
      </div>
      ${legendBlockHtml(bike, includeRemarks)}
      ${footnotesBlockHtml(bike)}
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
