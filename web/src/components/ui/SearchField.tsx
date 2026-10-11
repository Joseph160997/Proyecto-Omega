import { Search, X } from 'lucide-react'
import { useId, useRef } from 'react'

import { cx } from '@/lib/cx'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  /** Texto para lectores de pantalla (el campo no muestra etiqueta visible). */
  label: string
  placeholder?: string
  className?: string
}

export function SearchField({ value, onChange, label, placeholder, className }: SearchFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const clear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={cx('relative w-full max-w-sm', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
      />

      <input
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-line bg-panel py-2 pl-9 pr-9 text-sm text-fg placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
      />

      {value !== '' ? (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-fg-subtle transition-colors hover:text-fg"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
