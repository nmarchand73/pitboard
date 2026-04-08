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
}

export interface BikeDoc {
  id: string
  label: string
  manualFile: string
  pageOffset?: number
  intervals: IntervalDef[]
  tasks: MaintenanceTask[]
}
