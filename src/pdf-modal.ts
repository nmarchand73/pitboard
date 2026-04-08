import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

let activeLayer: HTMLDivElement | null = null
let activePdf: PDFDocumentProxy | null = null
let renderToken = 0
let detachPdfModal: (() => void) | null = null
let previousFocus: HTMLElement | null = null

function resolvePdfUrl(pdfPath: string): string {
  return new URL(pdfPath, window.location.origin).href
}

export function closePdfModal(): void {
  detachPdfModal?.()
  detachPdfModal = null
  void activePdf?.destroy().catch(() => {})
  activePdf = null
  activeLayer?.remove()
  activeLayer = null
  document.body.style.overflow = ''
  previousFocus?.focus?.()
  previousFocus = null
}

export function openPdfModal(
  pdfPath: string,
  initialPage1Based: number,
  contextTitle?: string | null,
): void {
  const savedFocus = document.activeElement as HTMLElement | null
  closePdfModal()
  previousFocus = savedFocus

  const token = ++renderToken
  let pageNum = Math.max(1, Math.floor(initialPage1Based))
  const headingText = contextTitle?.trim() || 'Manuel atelier'

  const layer = document.createElement('div')
  layer.className = 'pdf-modal'
  layer.setAttribute('role', 'dialog')
  layer.setAttribute('aria-modal', 'true')
  layer.setAttribute('aria-labelledby', 'pdf-modal-title')

  layer.innerHTML = `
    <button type="button" class="pdf-modal__backdrop" aria-label="Fermer le manuel"></button>
    <div class="pdf-modal__sheet">
      <header class="pdf-modal__toolbar">
        <button type="button" class="pdf-modal__btn pdf-modal__btn--close" id="pdf-modal-close">
          Fermer
        </button>
        <h2 class="pdf-modal__title" id="pdf-modal-title"></h2>
        <div class="pdf-modal__pager" role="navigation" aria-label="Navigation dans le PDF">
          <button type="button" class="pdf-modal__btn pdf-modal__btn--nav" data-pdf-prev aria-label="Page précédente">
            ‹
          </button>
          <span class="pdf-modal__page-indicator" aria-live="polite">
            <span class="pdf-modal__page-current">—</span>
            <span class="pdf-modal__page-sep" aria-hidden="true">/</span>
            <span class="pdf-modal__page-total">—</span>
          </span>
          <button type="button" class="pdf-modal__btn pdf-modal__btn--nav" data-pdf-next aria-label="Page suivante">
            ›
          </button>
        </div>
      </header>
      <p class="pdf-modal__status" role="status"></p>
      <div class="pdf-modal__viewport">
        <div class="pdf-modal__canvas-wrap">
          <canvas class="pdf-modal__canvas"></canvas>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(layer)
  activeLayer = layer
  document.body.style.overflow = 'hidden'

  const titleHeading = layer.querySelector('#pdf-modal-title') as HTMLHeadingElement
  titleHeading.textContent = headingText

  const backdrop = layer.querySelector('.pdf-modal__backdrop')!
  const btnClose = layer.querySelector('#pdf-modal-close')!
  const btnPrev = layer.querySelector('[data-pdf-prev]')!
  const btnNext = layer.querySelector('[data-pdf-next]')!
  const statusEl = layer.querySelector('.pdf-modal__status') as HTMLParagraphElement
  const canvas = layer.querySelector('.pdf-modal__canvas') as HTMLCanvasElement
  const wrap = layer.querySelector('.pdf-modal__canvas-wrap') as HTMLDivElement
  const elCurrent = layer.querySelector('.pdf-modal__page-current')!
  const elTotal = layer.querySelector('.pdf-modal__page-total')!

  const focusClose = () => {
    ;(btnClose as HTMLButtonElement).focus()
  }

  const updatePagerUi = (total: number) => {
    elCurrent.textContent = String(pageNum)
    elTotal.textContent = String(total)
    ;(btnPrev as HTMLButtonElement).disabled = pageNum <= 1
    ;(btnNext as HTMLButtonElement).disabled = pageNum >= total
  }

  const renderPage = async (): Promise<void> => {
    const pdf = activePdf
    if (!pdf || token !== renderToken) return
    const total = pdf.numPages
    pageNum = Math.min(Math.max(1, pageNum), total)
    updatePagerUi(total)

    statusEl.textContent = 'Affichage de la page…'
    statusEl.hidden = false

    try {
      const page = await pdf.getPage(pageNum)
      if (token !== renderToken) return

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) throw new Error('Canvas 2D indisponible')

      const cssW = Math.max(200, wrap.clientWidth)
      const base = page.getViewport({ scale: 1 })
      const scale = cssW / base.width
      const viewport = page.getViewport({ scale })

      const dpr = window.devicePixelRatio || 1
      const w = Math.floor(viewport.width * dpr)
      const h = Math.floor(viewport.height * dpr)
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)

      const renderTask = page.render({
        canvas,
        canvasContext: ctx,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      })
      await renderTask.promise
      if (token !== renderToken) return
      statusEl.textContent = ''
      statusEl.hidden = true
    } catch {
      if (token !== renderToken) return
      statusEl.hidden = false
      statusEl.textContent = 'Erreur d’affichage de la page. Essayez une autre page ou rechargez.'
    }
  }

  const onResize = () => {
    void renderPage()
  }

  const load = async (): Promise<void> => {
    statusEl.hidden = false
    statusEl.textContent = 'Chargement du manuel…'
    try {
      const url = resolvePdfUrl(pdfPath)
      const task = getDocument({ url })
      const pdf = await task.promise
      if (token !== renderToken) {
        void pdf.cleanup()
        return
      }
      activePdf = pdf
      pageNum = Math.min(pageNum, pdf.numPages)
      updatePagerUi(pdf.numPages)
      await renderPage()
      window.addEventListener('resize', onResize)
    } catch {
      if (token !== renderToken) return
      statusEl.hidden = false
      statusEl.textContent =
        'Impossible de charger le PDF. Vérifiez le réseau, ou ouvrez l’app via le serveur de développement (npm run dev).'
    }
  }

  const goPrev = () => {
    if (pageNum > 1) {
      pageNum -= 1
      void renderPage()
    }
  }

  const goNext = () => {
    if (activePdf && pageNum < activePdf.numPages) {
      pageNum += 1
      void renderPage()
    }
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closePdfModal()
    }
    if (e.key === 'ArrowLeft') goPrev()
    if (e.key === 'ArrowRight') goNext()
  }

  detachPdfModal = () => {
    document.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onResize)
  }

  backdrop.addEventListener('click', () => closePdfModal())
  btnClose.addEventListener('click', () => closePdfModal())
  btnPrev.addEventListener('click', goPrev)
  btnNext.addEventListener('click', goNext)
  document.addEventListener('keydown', onKey)

  requestAnimationFrame(focusClose)

  void load()
}
