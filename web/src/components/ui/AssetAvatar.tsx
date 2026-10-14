import { useState } from 'react'

import { initialOf } from '@/lib/format'

interface AssetAvatarProps {
  symbol: string
  imageUrl?: string
  size?: number
}

export function AssetAvatar({ symbol, imageUrl, size = 32 }: AssetAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const dimensions = { width: size, height: size }

  if (imageUrl !== undefined && imageUrl !== failedUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        {...dimensions}
        style={dimensions}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(imageUrl)}
        className="shrink-0 rounded-full bg-raised object-cover"
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={dimensions}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-fg-muted"
    >
      {initialOf(symbol)}
    </span>
  )
}
