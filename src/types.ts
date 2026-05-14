/** Repère visuel des pastilles « Moto » (couleurs / ton de la marque). */
export type BikeBrand = 'ktm' | 'yamaha' | 'triumph' | 'rieju'

/** Manuel PDF additionnel (ex. atelier moteur / châssis). */
export interface BikeExtraManual {
  path: string
  label: string
}

export type IntervalKind = 'hours' | 'event' | 'calendar'

/** Valeur texte dans une cellule (ex. note Triumph sous une colonne). */
export interface CellTextNote {
  type: 'text'
  value: string
}

export type CellPrimitive = 'none' | 'once' | 'periodic' | 'dash' | 'daily'

export type CellValue = CellPrimitive | CellTextNote

export function isCellTextNote(v: CellValue): v is CellTextNote {
  return typeof v === 'object' && v !== null && 'type' in v && (v as CellTextNote).type === 'text'
}

/** Une entrée de lien « manuel » pour une ligne (plusieurs PDF possibles). */
export interface ManualTaskRef {
  page: number
  /** PDF à ouvrir ; absent = `bike.manualFile`. */
  manualPath?: string
  /** Libellé court affiché dans le lien (ex. « Proprio. », « Châssis »). */
  shortLabel?: string
}

export interface IntervalDef {
  id: string
  label: string
  /** 2e ligne sous l’en-tête (ex. « jour », « 800 ou un mois »). */
  headerSub?: string
  kind: IntervalKind
}

export interface MaintenanceTask {
  id: string
  category: 'obligatoire' | 'recommandé'
  title: string
  /** Page du manuel principal ; peut être `null` si seulement `manualRefs` est renseigné. */
  page: number | null
  requiresSpecialTools: boolean
  /**
   * PDF à ouvrir pour cette tâche si différent du manuel principal (`bike.manualFile`).
   */
  manualPath?: string
  /**
   * Plusieurs renvois manuel (ex. propriétaire + atelier). Si défini et non vide,
   * il remplace `page` / `manualPath` pour l’affichage et les clics.
   */
  manualRefs?: ManualTaskRef[]
  cells: Record<string, CellValue>
  /**
   * Texte libre (ex. colonne « Remarques » du manuel) : lubrifiants, couples, renvois chapitre, etc.
   */
  remarks?: string
  /**
   * Fusion des colonnes d’intervalle : une seule cellule (texte constructeur, ex. « Tous les 300 km »).
   */
  intervalSpanText?: string
  /** Barre de catégorie (fond gris) affichée avant cette ligne. */
  sectionTitle?: string
}

/** Colonnes du tableau carnet par section (sinon modèle KTM par défaut). */
export interface CarnetColumnSets {
  obligatoire: string[]
  recommandé: string[]
}

export interface BikeDoc {
  id: string
  label: string
  brand: BikeBrand
  manualFile: string
  /** Libellé du premier bouton « manuel » dans l’en-tête (défaut : voir `main.ts`). */
  manualPrimaryLabel?: string
  /** Manuels PDF supplémentaires (réparation, châssis, etc.). */
  extraManuals?: BikeExtraManual[]
  /** Décalage page affichée PDF vs numéro de page dans les données (ex. KTM +2). */
  pageOffset?: number
  /** Grille : ids d’intervalle par section. */
  carnetColumns?: CarnetColumnSets
  /** Pastille numérotée barre « recommandés » (ex. KTM « 9.3 ») ; absent = pas de pastille. */
  carnetRecommendedBadge?: string
  /** En-tête coin haut-gauche du tableau (défaut : « Travaux à effectuer »). */
  carnetCornerLabel?: string
  /**
   * Lignes de légende (affichées après « Légende : »). Si absent, légende KTM/Yamaha par défaut.
   */
  carnetLegendLines?: string[]
  /** Notes de bas de page sous la légende (ex. * ‡ du manuel Triumph). */
  carnetFootnotes?: string[]
  intervals: IntervalDef[]
  tasks: MaintenanceTask[]
}
