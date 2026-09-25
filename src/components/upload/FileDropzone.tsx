import { useRef, useState, type DragEvent } from 'react'

interface Props {
  accept: string
  file: File | null
  onFile: (file: File) => void
  disabled?: boolean
}

const kb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

/** Zona para arrastrar o elegir un archivo. */
export function FileDropzone({ accept, file, onFile, disabled }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files[0]
    if (f && !disabled) onFile(f)
  }

  return (
    <div
      className={`dropzone${over ? ' over' : ''}${file ? ' has-file' : ''}${disabled ? ' disabled' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          input.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
      <div className="dropzone-icon" aria-hidden>
        {file ? '✓' : '↑'}
      </div>
      {file ? (
        <>
          <b>{file.name}</b>
          <span>
            {kb(file.size)} · <u>Cambiar archivo</u>
          </span>
        </>
      ) : (
        <>
          <b>Arrastre aquí el Informe de Tareas</b>
          <span>
            o <u>haga clic para elegirlo</u> · .xls o .xlsx exportado de la plataforma
          </span>
        </>
      )}
    </div>
  )
}
