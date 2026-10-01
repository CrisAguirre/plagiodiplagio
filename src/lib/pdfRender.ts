import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export type PdfDoc = Awaited<ReturnType<typeof pdfjsLib.getDocument>>['promise'] extends never
  ? never
  : import('pdfjs-dist').PDFDocumentProxy

export async function loadPdf(file: File) {
  const buf = await file.arrayBuffer()
  const loading = pdfjsLib.getDocument({ data: new Uint8Array(buf) })
  const doc = await loading.promise
  return doc
}

export async function renderPageToDataUrl(
  doc: import('pdfjs-dist').PDFDocumentProxy,
  pageNum: number,
  scale = 2,
): Promise<{ url: string; width: number; height: number }> {
  const page = await doc.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport } as never).promise
  return { url: canvas.toDataURL('image/jpeg', 0.92), width: canvas.width, height: canvas.height }
}
