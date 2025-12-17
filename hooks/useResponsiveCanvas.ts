import { useEffect, useState } from "react"
import { CANVAS_MAX_WIDTH, CANVAS_MAX_HEIGHT, CANVAS_MARGIN, CANVAS_ASPECT_RATIO } from "@/lib/gameConstants"

export function useResponsiveCanvas() {
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null

    const updateSize = () => {
      if (typeof window === "undefined") return
      const vw = window.innerWidth
      const vh = window.innerHeight

      // Check if mobile/tablet (portrait orientation)
      const mobile = vw <= 768 || (vw < vh && vw <= 1024)
      setIsMobile(mobile)

      if (mobile) {
        // Fullscreen on mobile/tablet
        setCanvasSize({
          width: vw,
          height: vh,
        })
      } else {
        // Constrained on desktop
        const targetWidth = Math.min(vw - CANVAS_MARGIN, CANVAS_MAX_WIDTH)
        const targetHeight = Math.min(vh - CANVAS_MARGIN, CANVAS_MAX_HEIGHT)

        let width = targetWidth
        let height = targetHeight

        if (width / height > CANVAS_ASPECT_RATIO) {
          width = height * CANVAS_ASPECT_RATIO
        } else {
          height = width / CANVAS_ASPECT_RATIO
        }

        setCanvasSize({
          width: Math.round(width),
          height: Math.round(height),
        })
      }
    }

    updateSize()

    // Throttle resize events to prevent excessive updates
    const throttledUpdate = () => {
      if (resizeTimeout) return
      resizeTimeout = setTimeout(() => {
        updateSize()
        resizeTimeout = null
      }, 100)
    }

    window.addEventListener("resize", throttledUpdate)
    window.addEventListener("orientationchange", updateSize)
    return () => {
      window.removeEventListener("resize", throttledUpdate)
      window.removeEventListener("orientationchange", updateSize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
    }
  }, [])

  return { canvasSize, isMobile }
}

