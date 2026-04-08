export type IntervalKind = 'hours' | 'event' | 'calendar'

export type CellValue = 'none' | 'once' | 'periodic'

export interface IntervalDef {
  id: string
  label: string
  kind: IntervalKind
}

export interface MaintenanceTask {
  id: string
  category: 'obligatoire' | 'recommandé'
  title: string
  page: number | null
  requiresSpecialTools: boolean
  cells: Record<string, CellValue>
  /**
   * Texte libre (ex. colonne « Remarques » du manuel) : lubrifiants, couples, renvois chapitre, etc.
   */
  remarks?: string
}

/** Colonnes du tableau carnet par section (sinon modèle KTM par défaut). */
export interface CarnetColumnSets {
  obligatoire: string[]
  recommandé: string[]
}

export interface BikeDoc {
  id: string
  label: string
  manualFile: string
  /** Décalage page affichée PDF vs numéro de page dans les données (ex. KTM +2). */
  pageOffset?: number
  /** Grille : ids d’intervalle par section. */
  carnetColumns?: CarnetColumnSets
  /** Pastille numérotée barre « recommandés » (ex. KTM « 9.3 ») ; absent = pas de pastille. */
  carnetRecommendedBadge?: string
  intervals: IntervalDef[]
  tasks: MaintenanceTask[]
}
