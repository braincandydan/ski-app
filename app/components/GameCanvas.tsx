"use client"

import { forwardRef } from "react"

interface GameCanvasProps {
  width: number
  height: number
  isMobile: boolean
  onPointerDown: () => void
  onPointerUp: () => void
}

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ width, height, isMobile, onPointerDown, onPointerUp }, ref) => {
    return (
      <canvas
        ref={ref}
        width={width}
        height={height}
        style={{ width, height }}
        className={`${isMobile ? "w-full h-full" : "rounded-lg shadow-2xl"} cursor-pointer touch-none`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    )
  },
)

GameCanvas.displayName = "GameCanvas"

