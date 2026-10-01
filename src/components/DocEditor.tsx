import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KImage, Group, Rect, Text, Transformer } from 'react-konva'
import type Konva from 'konva'
import { loadPdf, renderPageToDataUrl } from '../lib/pdfRender'
import { exportSinglePageToPdf, sendProEdit } from '../lib/pdfExport'

export type Patch = {
  id: string
  x: number
  y: number
  w: number
  h: number
  text: string
  bg: string
  fg: string
  fontSize: number
}

const uid = () => Math.random().toString(36).slice(2, 9)

export default function DocEditor({ file }: { file: File }) {
  const [doc, setDoc] = useState<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(1)
  const [page, setPage] = useState(1)
  const [bg, setBg] = useState<HTMLImageElement | null>(null)
  const [stageW, setStageW] = useState(800)
  const [stageH, setStageH] = useState(1000)
  const [renderW, setRenderW] = useState(0)
  const [patches, setPatches] = useState<Patch[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const nodeRefs = useRef<Map<string, Konva.Group>>(new Map())

  // cargar pdf
  useEffect(() => {
    let alive = true
    setPatches([])
    setSelId(null)
    loadPdf(file).then((d) => {
      if (!alive) return
      setDoc(d)
      setNumPages(d.numPages)
      setPage(1)
    }).catch((e) => setMsg(`Error cargando PDF: ${e}`))
    return () => { alive = false }
  }, [file])

  // render página
  useEffect(() => {
    if (!doc) return
    let alive = true
    setMsg(`Renderizando pág. ${page}…`)
    renderPageToDataUrl(doc, page, 2).then(({ url, width, height }) => {
      if (!alive) return
      const maxW = 860
      const s = Math.min(1, maxW / width)
      const img = new window.Image()
      img.onload = () => {
        if (!alive) return
        setBg(img)
        setRenderW(width)
        setStageW(Math.floor(width * s))
        setStageH(Math.floor(height * s))
        setMsg('')
      }
      img.src = url
    })
    return () => { alive = false }
  }, [doc, page])

  // transformer al seleccionar
  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    if (!selId) { tr.nodes([]); return }
    const node = nodeRefs.current.get(selId)
    if (node) { tr.nodes([node]); tr.getLayer()?.batchDraw() }
  }, [selId, patches, bg])

  const scale = renderW ? stageW / renderW : 1

  const addPatch = () => {
    const w = 220 * (1 / (scale || 1)) * 0.5 + 120
    const p: Patch = {
      id: uid(),
      x: (renderW || 800) / 2 - 110,
      y: 120,
      w: Math.max(140, w),
      h: 44,
      text: '12/03/2026',
      bg: '#ffffff',
      fg: '#141414',
      fontSize: 30,
    }
    setPatches((ps) => [...ps, p])
    setSelId(p.id)
  }

  const sel = patches.find((p) => p.id === selId) || null

  const updateSel = (patch: Partial<Patch>) => {
    if (!selId) return
    setPatches((ps) => ps.map((p) => (p.id === selId ? { ...p, ...patch } : p)))
  }

  const toBox1000 = (p: Patch) => {
    if (!renderW || !bg) return null
    const H = bg.naturalHeight / (bg.naturalWidth / renderW) || 1
    void H
    // renderW/H reales del canvas pdf.js; usamos proporción sobre imagen natural escalada
    const imgW = (bg as HTMLImageElement).width || renderW
    void imgW
    // Simplificado: coords en píxeles de render -> 0-1000
    const W = renderW
    const realH = stageH / (scale || 1)
    return {
      x0: (p.x / W) * 1000,
      y0: (p.y / realH) * 1000,
      x1: ((p.x + p.w) / W) * 1000,
      y1: ((p.y + p.h) / realH) * 1000,
    }
  }

  const onExportClient = async () => {
    const stage = stageRef.current
    if (!stage) return
    setSelId(null)
    await new Promise((r) => setTimeout(r, 60))
    const url = stage.toDataURL({ pixelRatio: 2 })
    await exportSinglePageToPdf(url, `${file.name.replace(/\.pdf$/i, '')}_p${page}_edit.pdf`)
    setMsg('PDF exportado en cliente (pdf-lib).')
  }

  const onProBackend = async () => {
    if (!sel) { setMsg('Selecciona una tapa para modo pro.'); return }
    const box = toBox1000(sel)
    if (!box) return
    setBusy(true); setMsg('Enviando a backend (inpaint)…')
    try {
      const blob = await sendProEdit({
        file, page_index: page - 1,
        x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1, text: sel.text,
      })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${file.name.replace(/\.pdf$/i, '')}_p${page}_pro.pdf`
      a.click()
      setMsg('PDF pro recibido del backend.')
    } catch (e) {
      setMsg(`Error backend: ${e}`)
    } finally { setBusy(false) }
  }

  return (
    <div className="editor">
      <div className="toolbar">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
        <span>Pág {page}/{numPages}</span>
        <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages}>›</button>
        <button onClick={addPatch}>+ Tapa fecha</button>
        <button onClick={onExportClient}>Exportar PDF</button>
        <button onClick={onProBackend} disabled={busy || !sel}>
          {busy ? 'Pro…' : 'Modo pro (backend)'}
        </button>
        {sel && <button className="danger" onClick={() => { setPatches((ps) => ps.filter((p) => p.id !== selId)); setSelId(null) }}>Eliminar</button>}
      </div>

      {msg && <p className="muted">{msg}</p>}

      <div className="stage-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelId(null) }}>
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelId(null) }}
        >
          <Layer>
            {bg && <KImage image={bg} width={renderW} height={stageH / (scale || 1)} listening={false} />}
            {patches.map((p) => (
              <Group
                key={p.id}
                ref={(n) => { if (n) nodeRefs.current.set(p.id, n); else nodeRefs.current.delete(p.id) }}
                x={p.x} y={p.y}
                draggable
                onClick={() => setSelId(p.id)}
                onTap={() => setSelId(p.id)}
                onDragEnd={(e) => setPatches((ps) => ps.map((q) => q.id === p.id ? { ...q, x: e.target.x(), y: e.target.y() } : q))}
                onTransformEnd={(e) => {
                  const node = e.target
                  const sx = node.scaleX(); const sy = node.scaleY()
                  node.scaleX(1); node.scaleY(1)
                  setPatches((ps) => ps.map((q) => q.id === p.id
                    ? { ...q, x: node.x(), y: node.y(), w: Math.max(20, q.w * sx), h: Math.max(16, q.h * sy) }
                    : q))
                }}
              >
                <Rect width={p.w} height={p.h} fill={p.bg} stroke={selId === p.id ? '#1e90ff' : '#999'} strokeWidth={1 / (scale || 1)} cornerRadius={2} />
                <Text text={p.text} fontSize={p.fontSize} fill={p.fg} width={p.w} height={p.h} align="center" verticalAlign="middle" padding={4} />
              </Group>
            ))}
            <Transformer ref={trRef} rotateEnabled={false} />
          </Layer>
        </Stage>
      </div>

      <div className="side">
        <h3>Parche seleccionado</h3>
        {!sel && <p className="muted">Clic en una tapa o crea una nueva.</p>}
        {sel && (
          <>
            <label>Texto nuevo
              <input value={sel.text} onChange={(e) => updateSel({ text: e.target.value })} />
            </label>
            <div className="row">
              <label>Fondo <input type="color" value={sel.bg} onChange={(e) => updateSel({ bg: e.target.value })} /></label>
              <label>Texto <input type="color" value={sel.fg} onChange={(e) => updateSel({ fg: e.target.value })} /></label>
              <label>Tamaño <input type="number" value={sel.fontSize} min={8} max={120} onChange={(e) => updateSel({ fontSize: Number(e.target.value) })} /></label>
            </div>
            <div className="row">
              <label>W <input type="number" value={Math.round(sel.w)} onChange={(e) => updateSel({ w: Number(e.target.value) })} /></label>
              <label>H <input type="number" value={Math.round(sel.h)} onChange={(e) => updateSel({ h: Number(e.target.value) })} /></label>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
