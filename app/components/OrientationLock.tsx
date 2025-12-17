"use client"

import { useEffect } from "react"

export default function OrientationLock() {
  useEffect(() => {
    // Lock orientation to portrait on mobile devices
    if (typeof window !== "undefined" && "screen" in window && "orientation" in window.screen) {
      const lockOrientation = async () => {
        try {
          // Try to lock to portrait
          if ("lock" in window.screen.orientation) {
            await (window.screen.orientation as any).lock("portrait")
          }
        } catch (err) {
          // Orientation lock may not be supported or may require user gesture
          // This is fine - the viewport meta tag will still help
          console.log("Orientation lock not available:", err)
        }
      }

      // Try to lock on mount
      lockOrientation()

      // Also try to lock on user interaction (required by some browsers)
      const handleInteraction = () => {
        lockOrientation()
        document.removeEventListener("touchstart", handleInteraction)
        document.removeEventListener("click", handleInteraction)
      }

      document.addEventListener("touchstart", handleInteraction, { once: true })
      document.addEventListener("click", handleInteraction, { once: true })

      return () => {
        document.removeEventListener("touchstart", handleInteraction)
        document.removeEventListener("click", handleInteraction)
      }
    }
  }, [])

  return null
}

