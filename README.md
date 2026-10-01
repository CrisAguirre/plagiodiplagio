# plagiodiplagio — front

App web responsive en blanco con Vite + React + TS para edición de documentos escaneados de `docs/`.

## Stack
- `pdfjs-dist` → render PDF a imagen
- `react-konva` / `konva` → capa edición (tapar + texto)
- `pdf-lib` → re-empaquetar a PDF en cliente
- Modo pro → `VITE_API_URL` (FastAPI en Render)

## Dev
```bash
npm install
npm run dev
```

Copia un PDF de `../docs/` o usa el input file. El visor/editor va en `src/App.tsx`.

## Deploy Vercel
- Framework: Vite
- Build: `npm run build`, Output: `dist`
- Env: `VITE_API_URL=https://tu-backend.onrender.com`
