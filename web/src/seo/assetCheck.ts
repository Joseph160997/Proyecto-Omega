/** Problemas entre los assets declarados, los que existen y la lista de pendientes. */
export function findAssetProblems(input: {
  declared: readonly string[]
  existing: ReadonlySet<string>
  pending: readonly string[]
}): string[] {
  const problems: string[] = []

  for (const path of input.pending) {
    if (!input.declared.includes(path)) {
      problems.push(`"${path}" está en PENDING_ASSETS pero no es un asset declarado`)
    } else if (input.existing.has(path)) {
      problems.push(`"${path}" ya existe en public/: quítalo de PENDING_ASSETS`)
    }
  }

  for (const path of input.declared) {
    if (!input.existing.has(path) && !input.pending.includes(path)) {
      problems.push(`Falta public${path}`)
    }
  }

  return problems
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Ancho y alto de un PNG leídos de su cabecera, o null si no es un PNG. */
export function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || PNG_SIGNATURE.some((value, index) => bytes[index] !== value)) return null

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  return { width: view.getUint32(16), height: view.getUint32(20) }
}
