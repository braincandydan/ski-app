"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"

interface Tree {
  x: number
  y: number
  id: number
}

interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

type Direction = "down" | "left" | "right"

export default function SkiGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu")
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)

  // Game state refs (using refs to avoid stale closures in animation loop)
  const gameStateRef = useRef({
    skierX: 300,
    skierY: 150,
    trees: [] as Tree[],
    speed: 140,
    score: 0,
    holding: false,
    nextDirection: "left" as "left" | "right",
    currentDirection: "down" as Direction,
    rotation: 0,
    targetRotation: 0,
    velocityX: 0,
    treeIdCounter: 0,
    lastTreeSpawn: 0,
    animationFrameId: 0,
    lastFrameTime: 0,
    trail: [] as TrailPoint[],
    lastTrailPoint: 0,
    cameraShakeX: 0,
    cameraShakeY: 0,
    avalancheY: -200, // Starts above the screen
    avalancheSpeed: 120, // Initial speed
    gameStartTime: 0, // Track when game started for avalanche acceleration
  })

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("skiGameBestScore")
    if (saved) setBestScore(Number.parseInt(saved))
  }, [])

  // Constants
  const CANVAS_WIDTH = 600
  const CANVAS_HEIGHT = 800
  const SKIER_SIZE = 24
  const SKIER_COLLISION_MARGIN = 14
  const BASE_SPEED = 140
  const SPEED_ACCELERATION = 80 // Speed increases when going straight
  const SPEED_DECELERATION = 40 // Speed decreases when turning (slower than acceleration)
  const MIN_SPEED = 100
  const MAX_SPEED = 700
  const BASE_SPAWN_INTERVAL = 550
  const SPAWN_INTERVAL_MEDIUM = 480
  const SPAWN_INTERVAL_FAST = 420
  const BASE_TURN_ACCELERATION = 0.08
  const MAX_TURN_VELOCITY = 4
  const TURN_DAMPING = 0.92
  const ROTATION_SPEED = 0.12
  const MAX_ROTATION = Math.PI / 6 // 30 degrees
  const TRAIL_SPACING = 15 // pixels between trail points
  const TRAIL_MAX_AGE = 1500 // milliseconds before trail fades
  const TRAIL_LINE_WIDTH = 4
  const SKIER_Y_MIN = CANVAS_HEIGHT * 0.75 // 25% from bottom (fast)
  const SKIER_Y_MAX = 150 // Starting position (slow)
  const SPEED_THRESHOLD_MIN = 300 // Speed at which skier starts moving down
  const SPEED_THRESHOLD_MAX = MAX_SPEED // Speed at which skier is at max forward position
  const AVALANCHE_BASE_SPEED = 120 // Starting speed
  const AVALANCHE_ACCELERATION = 15 // Speed increase per second
  const AVALANCHE_MAX_SPEED = 500 // Maximum avalanche speed

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Gradient background (cream to white)
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, "#fefce8")
      gradient.addColorStop(1, "#ffffff")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Diagonal lines for slope effect
      ctx.strokeStyle = "#f5f5f4"
      ctx.lineWidth = 2
      const offset = (Date.now() / 20) % 40
      for (let i = -20; i < CANVAS_HEIGHT + 40; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i + offset)
        ctx.lineTo(CANVAS_WIDTH, i + offset + 30)
        ctx.stroke()
      }
    },
    [CANVAS_HEIGHT],
  )

  const drawTrail = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      trail: TrailPoint[],
      currentTime: number,
      cameraShakeX: number,
      cameraShakeY: number,
    ) => {
      if (trail.length < 2) return

      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      for (let i = 0; i < trail.length - 1; i++) {
        const point = trail[i]
        const nextPoint = trail[i + 1]
        const age = currentTime - point.timestamp
        const opacity = Math.max(0, 1 - age / TRAIL_MAX_AGE)

        if (opacity > 0) {
          ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * 0.4})`
          ctx.lineWidth = TRAIL_LINE_WIDTH
          ctx.beginPath()
          ctx.moveTo(point.x + cameraShakeX, point.y + cameraShakeY)
          ctx.lineTo(nextPoint.x + cameraShakeX, nextPoint.y + cameraShakeY)
          ctx.stroke()
        }
      }
    },
    [TRAIL_MAX_AGE, TRAIL_LINE_WIDTH],
  )

  const drawSkier = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      rotation: number,
      cameraShakeX: number,
      cameraShakeY: number,
    ) => {
      ctx.save()
      ctx.translate(x + cameraShakeX, y + cameraShakeY)
      ctx.rotate(rotation)

      // Main skier body (teal square)
      ctx.fillStyle = "#14b8a6"
      ctx.fillRect(-SKIER_SIZE / 2, -SKIER_SIZE / 2, SKIER_SIZE, SKIER_SIZE)

      // Ski detail (white lines)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-8, 8)
      ctx.lineTo(-8, 16)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(8, 8)
      ctx.lineTo(8, 16)
      ctx.stroke()

      ctx.restore()
    },
    [SKIER_SIZE],
  )

  const drawTreeTrunk = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, cameraShakeX: number, cameraShakeY: number) => {
      const shakeX = x + cameraShakeX
      const shakeY = y + cameraShakeY

      // Brown trunk
      ctx.fillStyle = "#92400e"
      ctx.fillRect(shakeX - 8, shakeY + 20, 16, 20)
    },
    [],
  )

  const drawTreeTriangle = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, cameraShakeX: number, cameraShakeY: number) => {
      const shakeX = x + cameraShakeX
      const shakeY = y + cameraShakeY

      // Layered triangles for 3D effect
      // Back layer (darker teal)
      ctx.fillStyle = "#0d9488"
      ctx.beginPath()
      ctx.moveTo(shakeX, shakeY - 30)
      ctx.lineTo(shakeX - 30, shakeY + 20)
      ctx.lineTo(shakeX + 30, shakeY + 20)
      ctx.closePath()
      ctx.fill()

      // Middle layer (teal)
      ctx.fillStyle = "#14b8a6"
      ctx.beginPath()
      ctx.moveTo(shakeX, shakeY - 20)
      ctx.lineTo(shakeX - 25, shakeY + 15)
      ctx.lineTo(shakeX + 25, shakeY + 15)
      ctx.closePath()
      ctx.fill()

      // Front layer (light blue)
      ctx.fillStyle = "#22d3ee"
      ctx.beginPath()
      ctx.moveTo(shakeX, shakeY - 10)
      ctx.lineTo(shakeX - 20, shakeY + 10)
      ctx.lineTo(shakeX + 20, shakeY + 10)
      ctx.closePath()
      ctx.fill()
    },
    [],
  )

  const drawAvalanche = useCallback(
    (ctx: CanvasRenderingContext2D, avalancheY: number, cameraShakeX: number, cameraShakeY: number) => {
      if (avalancheY < -50) return // Don't draw if too far above screen

      const screenY = avalancheY + cameraShakeY

      // Create gradient for avalanche effect (white to gray)
      const gradient = ctx.createLinearGradient(0, screenY - 100, 0, screenY + 50)
      gradient.addColorStop(0, "rgba(255, 255, 255, 0)")
      gradient.addColorStop(0.4, "rgba(226, 232, 240, 0.7)")
      gradient.addColorStop(0.7, "rgba(203, 213, 225, 0.9)")
      gradient.addColorStop(1, "rgba(148, 163, 184, 1)")

      ctx.fillStyle = gradient
      ctx.fillRect(0, screenY - 100, CANVAS_WIDTH, 150)

      // Add some cloud-like particles for effect
      ctx.fillStyle = "rgba(241, 245, 249, 0.8)"
      for (let i = 0; i < 8; i++) {
        const x = (i * CANVAS_WIDTH) / 7 + Math.sin(Date.now() / 500 + i) * 20
        const size = 30 + Math.sin(Date.now() / 400 + i * 2) * 10
        ctx.beginPath()
        ctx.arc(x + cameraShakeX, screenY - 50 + Math.cos(Date.now() / 600 + i) * 15, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Warning text when avalanche is getting close
      if (screenY > -50 && screenY < CANVAS_HEIGHT / 3) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
        ctx.font = "bold 24px Geist, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("AVALANCHE!", CANVAS_WIDTH / 2, screenY + 80)
        ctx.textAlign = "left"
      }
    },
    [CANVAS_WIDTH, CANVAS_HEIGHT],
  )

  const checkCollision = useCallback(
    (skierX: number, skierY: number, trees: Tree[]) => {
      // Check edge collision
      if (
        skierX - SKIER_SIZE / 2 < SKIER_COLLISION_MARGIN ||
        skierX + SKIER_SIZE / 2 > CANVAS_WIDTH - SKIER_COLLISION_MARGIN
      ) {
        return true
      }

      // Check tree collision - only with brown trunk (not triangle)
      // Trunk: x - 8 to x + 8 (16px wide), y + 20 to y + 40 (20px tall)
      const TRUNK_HEIGHT = 20
      const TRUNK_OFFSET_X = 8
      const TRUNK_OFFSET_Y = 20

      for (const tree of trees) {
        const skierLeft = skierX - SKIER_SIZE / 2
        const skierRight = skierX + SKIER_SIZE / 2
        const skierTop = skierY - SKIER_SIZE / 2
        const skierBottom = skierY + SKIER_SIZE / 2

        // Only check collision with the trunk part
        const trunkLeft = tree.x - TRUNK_OFFSET_X
        const trunkRight = tree.x + TRUNK_OFFSET_X
        const trunkTop = tree.y + TRUNK_OFFSET_Y
        const trunkBottom = tree.y + TRUNK_OFFSET_Y + TRUNK_HEIGHT

        if (skierRight > trunkLeft && skierLeft < trunkRight && skierBottom > trunkTop && skierTop < trunkBottom) {
          return true
        }
      }

      return false
    },
    [CANVAS_WIDTH, SKIER_SIZE, SKIER_COLLISION_MARGIN],
  )

  const gameLoop = useCallback(
    (timestamp: number) => {
      const state = gameStateRef.current
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const deltaTime = state.lastFrameTime ? (timestamp - state.lastFrameTime) / 1000 : 0
      state.lastFrameTime = timestamp

      const elapsedTime = state.gameStartTime ? (timestamp - state.gameStartTime) / 1000 : 0

      drawBackground(ctx)

      state.avalancheSpeed = Math.min(AVALANCHE_BASE_SPEED + AVALANCHE_ACCELERATION * elapsedTime, AVALANCHE_MAX_SPEED)
      state.avalancheY += state.avalancheSpeed * deltaTime

      const speedFactor = (state.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)
      const turnAcceleration = BASE_TURN_ACCELERATION * (1 + speedFactor * 1.5)

      if (state.holding) {
        state.speed = Math.max(state.speed - SPEED_DECELERATION * deltaTime, MIN_SPEED)

        const speedBasedMaxVelocity = MAX_TURN_VELOCITY * (0.4 + speedFactor * 1.2)

        if (state.nextDirection === "left") {
          state.velocityX -= turnAcceleration
          state.targetRotation = -MAX_ROTATION
          state.currentDirection = "left"
        } else {
          state.velocityX += turnAcceleration
          state.targetRotation = MAX_ROTATION
          state.currentDirection = "right"
        }
        state.velocityX = Math.max(-speedBasedMaxVelocity, Math.min(speedBasedMaxVelocity, state.velocityX))
      } else {
        state.speed = Math.min(state.speed + SPEED_ACCELERATION * deltaTime, MAX_SPEED)

        state.velocityX *= TURN_DAMPING
        state.targetRotation = 0
        state.currentDirection = "down"

        if (Math.abs(state.velocityX) < 0.01) {
          state.velocityX = 0
        }
      }

      state.rotation += (state.targetRotation - state.rotation) * ROTATION_SPEED

      const shakeIntensity = Math.max(0, (state.speed - 300) / (MAX_SPEED - 300)) * 3
      state.cameraShakeX = (Math.random() - 0.5) * shakeIntensity
      state.cameraShakeY = (Math.random() - 0.5) * shakeIntensity

      if (state.speed >= SPEED_THRESHOLD_MIN) {
        const speedProgress = Math.min(
          1,
          (state.speed - SPEED_THRESHOLD_MIN) / (SPEED_THRESHOLD_MAX - SPEED_THRESHOLD_MIN),
        )
        const targetY = SKIER_Y_MAX + (SKIER_Y_MIN - SKIER_Y_MAX) * speedProgress
        state.skierY += (targetY - state.skierY) * 0.05
      } else {
        state.skierY += (SKIER_Y_MAX - state.skierY) * 0.05
      }

      state.skierX += state.velocityX

      const distanceFromLast =
        state.trail.length > 0
          ? Math.sqrt(
              Math.pow(state.skierX - state.trail[state.trail.length - 1].x, 2) +
                Math.pow(state.skierY - state.trail[state.trail.length - 1].y, 2),
            )
          : TRAIL_SPACING + 1

      if (distanceFromLast >= TRAIL_SPACING) {
        state.trail.push({
          x: state.skierX,
          y: state.skierY,
          timestamp: timestamp,
        })

        state.trail = state.trail.filter((point) => timestamp - point.timestamp < TRAIL_MAX_AGE)
      }

      const spawnInterval =
        state.speed >= 260 ? SPAWN_INTERVAL_FAST : state.speed >= 200 ? SPAWN_INTERVAL_MEDIUM : BASE_SPAWN_INTERVAL

      if (timestamp - state.lastTreeSpawn > spawnInterval) {
        const newTree: Tree = {
          x: Math.random() * (CANVAS_WIDTH - 100) + 50,
          y: CANVAS_HEIGHT + 50,
          id: state.treeIdCounter++,
        }
        state.trees.push(newTree)
        state.lastTreeSpawn = timestamp
      }

      state.trees = state.trees
        .map((tree) => ({ ...tree, y: tree.y - state.speed * deltaTime }))
        .filter((tree) => tree.y > -100)

      state.trail = state.trail.map((point) => ({
        ...point,
        y: point.y - state.speed * deltaTime,
      }))

      state.avalancheY -= state.speed * deltaTime

      drawAvalanche(ctx, state.avalancheY, state.cameraShakeX, state.cameraShakeY)

      drawTrail(ctx, state.trail, timestamp, state.cameraShakeX, state.cameraShakeY)

      // Draw tree trunks first (behind skier)
      state.trees.forEach((tree) => drawTreeTrunk(ctx, tree.x, tree.y, state.cameraShakeX, state.cameraShakeY))

      // Draw skier (goes behind tree triangles)
      drawSkier(ctx, state.skierX, state.skierY, state.rotation, state.cameraShakeX, state.cameraShakeY)

      // Draw tree triangles last (in front of skier)
      state.trees.forEach((tree) => drawTreeTriangle(ctx, tree.x, tree.y, state.cameraShakeX, state.cameraShakeY))

      if (state.avalancheY >= state.skierY - 30) {
        setGameState("gameover")
        setScore(Math.floor(state.score))
        if (state.score > bestScore) {
          const newBest = Math.floor(state.score)
          setBestScore(newBest)
          localStorage.setItem("skiGameBestScore", newBest.toString())
        }
        return
      }

      if (checkCollision(state.skierX, state.skierY, state.trees)) {
        setGameState("gameover")
        setScore(Math.floor(state.score))
        if (state.score > bestScore) {
          const newBest = Math.floor(state.score)
          setBestScore(newBest)
          localStorage.setItem("skiGameBestScore", newBest.toString())
        }
        return
      }

      state.score += (state.speed / 100) * deltaTime

      ctx.fillStyle = "#1f2937"
      ctx.font = "bold 20px Geist, sans-serif"
      ctx.fillText(`${Math.floor(state.score)}m`, 20, 40)

      ctx.font = "16px Geist, sans-serif"
      ctx.fillText(`${Math.floor(state.speed)} px/s`, 20, 65)

      const arrow = state.currentDirection === "left" ? "⬅" : state.currentDirection === "right" ? "➡" : "↓"
      ctx.font = "32px sans-serif"
      ctx.fillText(arrow, CANVAS_WIDTH - 60, 45)

      state.animationFrameId = requestAnimationFrame(gameLoop)
    },
    [
      drawBackground,
      drawAvalanche,
      drawSkier,
      drawTreeTrunk,
      drawTreeTriangle,
      drawTrail,
      checkCollision,
      bestScore,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      BASE_SPAWN_INTERVAL,
      SPAWN_INTERVAL_MEDIUM,
      SPAWN_INTERVAL_FAST,
      MIN_SPEED,
      MAX_SPEED,
      SPEED_ACCELERATION,
      SPEED_DECELERATION,
      BASE_TURN_ACCELERATION,
      TRAIL_SPACING,
      TRAIL_MAX_AGE,
      SKIER_Y_MIN,
      SKIER_Y_MAX,
      SPEED_THRESHOLD_MIN,
      SPEED_THRESHOLD_MAX,
      AVALANCHE_BASE_SPEED,
      AVALANCHE_ACCELERATION,
      AVALANCHE_MAX_SPEED,
    ],
  )

  const startGame = useCallback(() => {
    const state = gameStateRef.current
    state.skierX = CANVAS_WIDTH / 2
    state.skierY = 150
    state.trees = []
    state.speed = BASE_SPEED
    state.score = 0
    state.holding = false
    state.nextDirection = "left"
    state.currentDirection = "down"
    state.rotation = 0
    state.targetRotation = 0
    state.velocityX = 0
    state.treeIdCounter = 0
    state.lastTreeSpawn = 0
    state.lastFrameTime = 0
    state.trail = []
    state.lastTrailPoint = 0
    state.cameraShakeX = 0
    state.cameraShakeY = 0
    state.avalancheY = -200
    state.avalancheSpeed = AVALANCHE_BASE_SPEED
    state.gameStartTime = performance.now()

    setGameState("playing")
    setScore(0)

    state.animationFrameId = requestAnimationFrame(gameLoop)
  }, [gameLoop, CANVAS_WIDTH, BASE_SPEED, AVALANCHE_BASE_SPEED])

  const handlePointerDown = useCallback(() => {
    const state = gameStateRef.current

    if (gameState === "menu" || gameState === "gameover") {
      return // Button handles these states
    }

    if (gameState === "playing" && !state.holding) {
      state.holding = true
    }
  }, [gameState])

  const handlePointerUp = useCallback(() => {
    const state = gameStateRef.current

    if (gameState === "playing" && state.holding) {
      state.holding = false
      state.nextDirection = state.nextDirection === "left" ? "right" : "left"
    }
  }, [gameState])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (gameStateRef.current.animationFrameId) {
        cancelAnimationFrame(gameStateRef.current.animationFrameId)
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg shadow-2xl cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {(gameState === "menu" || gameState === "gameover") && (
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
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
                <p className="text-slate-600 mb-6">
                  Best: <span className="font-semibold text-slate-900">{bestScore}m</span>
                </p>
              )}

              <Button onClick={startGame} size="lg" className="w-full mb-3 bg-teal-600 hover:bg-teal-700">
                {gameState === "menu" ? "Start Skiing" : "Try Again"}
              </Button>

              {gameState === "menu" && (
                <Button
                  onClick={() => setShowInstructions(!showInstructions)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {showInstructions ? "Hide" : "How to Play"}
                </Button>
              )}

              {showInstructions && gameState === "menu" && (
                <div className="mt-4 p-4 bg-slate-50 rounded text-left text-sm text-slate-700">
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
        )}

        {gameState === "playing" && score < 50 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm animate-pulse">
            Hold to turn • Release to go straight
          </div>
        )}
      </div>
    </div>
  )
}
