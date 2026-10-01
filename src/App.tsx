import { useState } from 'react'
import './App.css'

/**
 * App en blanco - base responsive para editor de documentos escaneados.
 *
 * Stack previsto:
 *  render: pdfjs-dist -> canvas
 *  edición: react-konva (Rect tapa + Text overlay)
 *  export: pdf-lib
 *  pro: POST /api/apply-edit al backend FastAPI (Render)
 */
function App() {
  const [pdfName, setPdfName] = useState<string | null>(null)

  const onFile = (f: File | undefined) => {
    if (!f) return
    setPdfName(f.name)
    // TODO: pdfjs-dist getDocument(arrayBuffer) -> render página -> Konva Stage
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>plagiodiplagio</h1>
        <p>Editor web responsive — base Vite + React</p>
      </header>

      <main className="layout">
        <aside className="panel">
          <h2>1. Cargar documento</h2>
          <p className="muted">
            Copia un PDF de <code>../../docs/</code> o súbelo aquí. En prod vendrá de la API / storage.
          </p>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {pdfName && <p>Seleccionado: <b>{pdfName}</b></p>}

          <h2>2. Editar</h2>
          <p className="muted">
            Próximo: Stage Konva sobre render pdf.js. Rect para tapar fecha + Text arrastrable.
          </p>

          <h2>3. Exportar</h2>
          <p className="muted">Próximo: pdf-lib re-empaqueta a PDF. Modo pro usa backend Python.</p>

          <div className="env">
            <small>API: {import.meta.env.VITE_API_URL || 'http://localhost:8000 (dev proxy /api)'}</small>
          </div>
        </aside>

        <section className="canvas-zone">
          <div className="placeholder">
            <p>Zona visor / editor (responsive)</p>
            <span>pdf.js + react-konva aquí</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
