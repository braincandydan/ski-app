"use client"

import { Button } from "@/components/ui/button"
import type { GameState } from "@/lib/gameTypes"

interface GameMenuProps {
  gameState: GameState
  score: number
  bestScore: number
  showInstructions: boolean
  onStartGame: () => void
  onToggleInstructions: () => void
  isMobile: boolean
}

export function GameMenu({
  gameState,
  score,
  bestScore,
  showInstructions,
  onStartGame,
  onToggleInstructions,
  isMobile,
}: GameMenuProps) {
  if (gameState === "playing") return null

  return (
    <div className={`absolute inset-0 bg-black/40 ${isMobile ? "" : "rounded-lg"} flex items-center justify-center backdrop-blur-sm`}>
      <div className={`bg-white p-6 md:p-8 ${isMobile ? "rounded-none" : "rounded-lg"} shadow-xl text-center max-w-md w-[90vw]`}>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          {gameState === "menu" ? "Downhill Ski" : "Crash!"}
        </h1>

        {gameState === "gameover" && (
          <div className="mb-4">
            <p className="text-2xl font-semibold text-teal-600 mb-1">{score}m</p>
            {score === bestScore && score > 0 && (
              <p className="text-sm text-amber-600 font-medium">🏆 New Best!</p>
            )}
          </div>
        )}

        {bestScore > 0 && (
          <p className="text-slate-600 mb-4 md:mb-6">
            Best: <span className="font-semibold text-slate-900">{bestScore}m</span>
          </p>
        )}

        <Button onClick={onStartGame} size="lg" className="w-full mb-3 bg-teal-600 hover:bg-teal-700">
          {gameState === "menu" ? "Start Skiing" : "Try Again"}
        </Button>

        {gameState === "menu" && (
          <Button onClick={onToggleInstructions} variant="outline" size="lg" className="w-full">
            {showInstructions ? "Hide" : "How to Play"}
          </Button>
        )}

        {showInstructions && gameState === "menu" && (
          <div className="mt-4 p-4 bg-slate-50 rounded text-left text-xs md:text-sm text-slate-700 max-h-48 overflow-y-auto">
            <p className="font-semibold mb-2">Controls:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Hold anywhere to turn</li>
              <li>First hold = left, second = right</li>
              <li>Release to go straight</li>
              <li>Avoid trees and edges</li>
              <li>Stay ahead of the avalanche!</li>
              <li>Turn to slow down, go straight to speed up</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

