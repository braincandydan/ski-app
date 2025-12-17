import { useEffect, useRef, useState } from "react"

export function useSpriteLoader(spritePath: string) {
  const spriteRef = useRef<HTMLImageElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const frameWidthRef = useRef<number>(0)
  const frameHeightRef = useRef<number>(0)

  useEffect(() => {
    const img = new Image()
    img.src = spritePath
    img.onload = () => {
      spriteRef.current = img
      // Cache frame dimensions (assuming 5 frames)
      frameWidthRef.current = img.width / 5
      frameHeightRef.current = img.height
      setLoaded(true)
    }
    img.onerror = () => {
      console.warn(`Failed to load sprite: ${spritePath}`)
    }
  }, [spritePath])

  return {
    sprite: spriteRef.current,
    loaded,
    frameWidth: frameWidthRef.current,
    frameHeight: frameHeightRef.current,
  }
}

