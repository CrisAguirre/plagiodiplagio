import { useState } from 'react'
import { sendAutoReplace } from '../lib/pdfExport'

const DATE_RE = /^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/

export default function AutoReplace({ file }: { file: File }) {
  const [newDate, setNewDate] = useState('12/03/2026')
  const [dpi, setDpi] = useState(200)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const valid = DATE_RE.test(newDate.trim())

  const onRun = async () => {
    if (!valid) { setMsg('Formato esperado: DD/MM/AAAA (ej. 12/03/2026).'); return }
    setBusy(true)
    setMsg('Detectando fechas y reemplazando en todo el documento… (puede tardar 1-2 min en 23 págs)')
    try {
      const { blob, total, pages } = await sendAutoReplace({ file, new_text: newDate.trim(), dpi })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${file.name.replace(/\.pdf$/i, '')}_fechas_${newDate.trim().replace(/\//g, '-')}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10000)
      setMsg(total >= 0
        ? `Listo: ${total} fecha(s) reemplazadas en ${pages} pág(s) por "${newDate.trim()}". PDF completo descargado. Revisa que no queden fechas sin cambiar; si alguna faltó, usa el modo manual abajo.`
        : 'PDF recibido.')
    } catch (e) {
      setMsg(`Error backend: ${e}`)
    } finally { setBusy(false) }
  }

  return (
    <div className="panel" style={{ marginBottom: 12 }}>
      <h2>2. Reemplazo automático de fechas</h2>
      <p className="muted">
        Detecta TODAS las fechas del documento, las elimina con inpaint y sobrepone la nueva
        <b> dentro del área escaneada</b> (no fuera del documento). Devuelve el PDF completo.
      </p>
      <div className="row">
        <label>Nueva fecha (misma para todo)
          <input value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="DD/MM/AAAA" />
        </label>
        <label>Calidad
          <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
            <option value={150}>Rápida (150 dpi)</option>
            <option value={200}>Equilibrada (200 dpi)</option>
            <option value={250}>Precisa (250 dpi, lenta)</option>
          </select>
        </label>
      </div>
      <button onClick={onRun} disabled={busy || !valid} style={{ marginTop: 8 }}>
        {busy ? 'Reemplazando…' : 'Reemplazar fechas automáticamente'}
      </button>
      {msg && <p className="muted">{msg}</p>}
    </div>
  )
}
