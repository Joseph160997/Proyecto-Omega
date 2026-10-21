const CHANNEL_NAME = 'proyecto-omega-ledger'
const CHANGE_MESSAGE = { type: 'changed' } as const

let channel: BroadcastChannel | undefined

function getChannel(): BroadcastChannel | undefined {
  if (typeof BroadcastChannel === 'undefined') return undefined

  channel ??= new BroadcastChannel(CHANNEL_NAME)

  return channel
}

export function publishLedgerChange(): void {
  getChannel()?.postMessage(CHANGE_MESSAGE)
}

export function subscribeToLedgerChanges(onChange: () => void): () => void {
  const current = getChannel()

  if (!current) return () => undefined

  const listener = (event: MessageEvent<unknown>) => {
    if (
      typeof event.data === 'object' &&
      event.data !== null &&
      'type' in event.data &&
      event.data.type === 'changed'
    ) {
      onChange()
    }
  }

  current.addEventListener('message', listener)

  return () => current.removeEventListener('message', listener)
}
