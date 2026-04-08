import type { BikeDoc } from './types'

/** Page PDF 1-based pour le viewer (carnet imprimé + décalage fichier). */
export function pdfStartPage(bike: BikeDoc, taskPage: number | null): number {
  const base = taskPage ?? 1
  return base + (bike.pageOffset ?? 0)
}
