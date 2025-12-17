"use client"

interface GameHUDProps {
  score: number
  speed: number
  canvasWidth: number
}

export function GameHUD({ score, speed, canvasWidth }: GameHUDProps) {
  return (
    <div className="absolute top-4 left-4 text-slate-900">
      <div className="font-bold text-xl">{score}m</div>
      {canvasWidth > 400 && <div className="text-sm text-slate-600">{speed} px/s</div>}
    </div>
  )
}

