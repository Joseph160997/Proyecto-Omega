import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest no activa los globals, así que Testing Library no limpia sola entre tests.
afterEach(() => {
  cleanup()
})

// jsdom no implementa scrollIntoView, y la tabla lo usa al cambiar de página.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
