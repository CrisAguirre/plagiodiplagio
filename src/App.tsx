import { useState } from 'react'
import './App.css'
import DocEditor from './components/DocEditor'

function App() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <div className="app">
      <header className="topbar">
        <h1>plagiodiplagio</h1>
        <p>Editor web responsive — Vite + React + Konva + pdf-lib + FastAPI</p>
      </header>

      <main className="layout">
        <aside className="panel">
          <h2>1. Cargar documento</h2>
          <p className="muted">
            Sube un PDF escaneado (ej. copia de <code>docs/</code>). Todo queda local salvo modo pro.
          </p>
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
              <span>Render pdf.js → tapas Konva → export pdf-lib / backend pro</span>
            </div>
          )}
          {file && <DocEditor key={file.name + file.size} file={file} />}
        </section>
      </main>
    </div>
  )
}

export default App
