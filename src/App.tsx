import { useState } from 'react'
import './App.css'
import DocEditor from './components/DocEditor'
import AutoReplace from './components/AutoReplace'

const BUNDLED_DOCS = [
  { id: '2-hispanoamerica.pdf', label: '2 - Hispanoamérica (23 págs)' },
  { id: '3-medcali.pdf', label: '3 - Med Cali (7 págs)' },
  { id: '5-psiquiatria.pdf', label: '5 - Psiquiatría (8 págs)' },
  { id: '6-fisiatria.pdf', label: '6 - Fisiatría (4 págs)' },
]

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const loadBundled = async (id: string) => {
    setLoading(id)
    try {
      const r = await fetch(`/docs/${id}`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const blob = await r.blob()
      setFile(new File([blob], id, { type: 'application/pdf' }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>plagiodiplagio</h1>
        <p>Reemplazo automático de fechas in-situ — detecta, borra con inpaint y sobrepone la nueva fecha</p>
      </header>

      <main className="layout">
        <aside className="panel">
          <h2>1. Cargar documento</h2>
          <p className="muted">Elige uno del proyecto o sube otro. Todo queda local salvo modo automático/pro.</p>
          <div className="doc-list">
            {BUNDLED_DOCS.map((d) => (
              <button
                key={d.id}
                disabled={loading !== null}
                onClick={() => loadBundled(d.id)}
                className={file?.name === d.id ? 'active' : ''}
              >
                {loading === d.id ? 'Cargando…' : d.label}
              </button>
            ))}
          </div>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file && <p>Seleccionado: <b>{file.name}</b> ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          <div className="env">
            <small>API: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}</small>
          </div>
        </aside>

        <section className="canvas-zone">
          {!file && (
            <div className="placeholder">
              <p>Sube un PDF para empezar</p>
              <span>Automático: detecta fechas → inpaint → nueva fecha in-situ → PDF completo</span>
            </div>
          )}
          {file && (
            <div className="editor">
              <AutoReplace file={file} />
              <details>
                <summary className="muted">Revisión manual (fallback: 1 parche por vez si el OCR omitió alguna fecha)</summary>
                <DocEditor key={file.name + file.size} file={file} />
              </details>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
