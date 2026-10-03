import { PDFDocument } from 'pdf-lib'

const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'

export function apiUrl(path: string) {
  return `${API.replace(/\/$/, '')}${path}`
}

/** Exporta 1 página editada (dataURL) a PDF con pdf-lib, tamaño carta/original. */
export async function exportSinglePageToPdf(dataUrl: string, filename = 'editado.pdf') {
  const res = await fetch(dataUrl)
  const bytes = await res.arrayBuffer()
  const isPng = dataUrl.startsWith('data:image/png')
  const out = await PDFDocument.create()
  const embedded = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes)
  const page = out.addPage([embedded.width, embedded.height])
  page.drawImage(embedded, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
  const pdfBytes = await out.save()
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

/** Modo automático: reemplaza TODAS las fechas in-situ y devuelve el PDF COMPLETO. */
export async function sendAutoReplace(args: {
  file: File
  new_text: string
  dpi?: number
}): Promise<{ blob: Blob; total: number; pages: number }> {
  const fd = new FormData()
  fd.append('file', args.file)
  fd.append('new_text', args.new_text)
  fd.append('dpi', String(args.dpi ?? 200))
  const r = await fetch(apiUrl('/replace-dates'), { method: 'POST', body: fd })
  if (!r.ok) throw new Error(`backend ${r.status}: ${await r.text()}`)
  return {
    blob: await r.blob(),
    total: Number(r.headers.get('X-Replacements-Total') ?? -1),
    pages: Number(r.headers.get('X-Pages') ?? -1),
  }
}
/** Modo manual (fallback): 1 parche de 1 página con inpaint real. */
export async function sendProEdit(args: {
  file: File
  page_index: number
  x0: number
  y0: number
  x1: number
  y1: number
  text: string
}): Promise<Blob> {
  const fd = new FormData()
  fd.append('file', args.file)
  fd.append('page_index', String(args.page_index))
  fd.append('x0', String(args.x0))
  fd.append('y0', String(args.y0))
  fd.append('x1', String(args.x1))
  fd.append('y1', String(args.y1))
  fd.append('text', args.text)
  const r = await fetch(apiUrl('/apply-edit'), { method: 'POST', body: fd })
  if (!r.ok) throw new Error(`backend ${r.status}: ${await r.text()}`)
  return await r.blob()
}
