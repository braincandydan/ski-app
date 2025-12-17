"use client"

import { useRef, useState, useEffect } from "react"
import type { GameState } from "@/lib/gameTypes"
import { useResponsiveCanvas } from "@/hooks/useResponsiveCanvas"
import { useSpriteLoader } from "@/hooks/useSpriteLoader"
import { useSkiGame } from "@/hooks/useSkiGame"
import { GameCanvas } from "./components/GameCanvas"
import { GameMenu } from "./components/GameMenu"

export default function SkiGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("menu")
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)

  const { canvasSize, isMobile } = useResponsiveCanvas()
  const { sprite, loaded: spriteLoaded, frameWidth, frameHeight } = useSpriteLoader("/sprites/skier-sprite.png")

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore)
    setGameState("gameover")
    if (finalScore > bestScore) {
      setBestScore(finalScore)
    }
  }

  const game = useSkiGame({
    canvasRef,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    sprite,
    spriteLoaded,
    frameWidth,
    frameHeight,
    onGameOver: handleGameOver,
    bestScore,
  })

  // Load best score from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("skiGameBestScore") : null
    if (saved) setBestScore(Number.parseInt(saved))
  }, [])

  // Register service worker for PWA (if present)
  useEffect(() => {
    if (typeof window === "undefined") return
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // ignore errors in dev
      })
    }
  }, [])

  const handleStartGame = () => {
    setGameState("playing")
    setScore(0)
    game.startGame()
  }

  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 ${isMobile ? "p-0 fixed inset-0" : "px-2"}`}>
      <div className={`relative ${isMobile ? "w-full h-full" : "max-w-full"}`} style={isMobile ? {} : { maxWidth: 600 }}>
        <GameCanvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          isMobile={isMobile}
          onPointerDown={game.handlePointerDown}
          onPointerUp={game.handlePointerUp}
        />

        <GameMenu
          gameState={gameState}
          score={score}
          bestScore={bestScore}
          showInstructions={showInstructions}
          onStartGame={handleStartGame}
          onToggleInstructions={() => setShowInstructions(!showInstructions)}
          isMobile={isMobile}
        />

        {gameState === "playing" && score < 50 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs md:text-sm animate-pulse max-w-[90vw] text-center">
            Hold to turn • Release to go straight
          </div>
        )}
      </div>
    </div>
  )
}
