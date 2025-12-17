import { useRef, useCallback, useEffect } from "react"
import type { GameStateRef, Tree, TrailPoint } from "@/lib/gameTypes"
import {
  BASE_SPEED,
  SPEED_ACCELERATION,
  SPEED_DECELERATION,
  ROTATION_SPEED_PENALTY,
  MIN_SPEED,
  MAX_SPEED,
  BASE_TURN_ACCELERATION,
  MAX_TURN_VELOCITY,
  HORIZONTAL_SPEED_MULTIPLIER,
  TURN_DAMPING,
  ROTATION_SPEED,
  MAX_ROTATION,
  MAX_EXTENDED_ROTATION,
  TURN_PROGRESSION_TIME,
  EXTENDED_TURN_TIME,
  CURVE_FACTOR,
  TRAIL_SPACING,
  TRAIL_MAX_AGE,
  BASE_SPAWN_INTERVAL,
  SPAWN_INTERVAL_MEDIUM,
  SPAWN_INTERVAL_FAST,
  SKIER_Y_MAX,
  SPEED_THRESHOLD_MIN,
  AVALANCHE_BASE_SPEED,
  AVALANCHE_ACCELERATION,
  AVALANCHE_MAX_SPEED,
} from "@/lib/gameConstants"
import {
  drawBackground,
  drawTrail,
  drawSkier,
  drawTreeTrunk,
  drawTreeTriangle,
  drawAvalanche,
  checkCollision,
} from "@/lib/gameRenderer"

interface UseSkiGameProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  canvasWidth: number
  canvasHeight: number
  sprite: HTMLImageElement | null
  spriteLoaded: boolean
  frameWidth: number
  frameHeight: number
  onGameOver: (score: number) => void
  bestScore: number
}

export function useSkiGame({
  canvasRef,
  canvasWidth,
  canvasHeight,
  sprite,
  spriteLoaded,
  frameWidth,
  frameHeight,
  onGameOver,
  bestScore,
}: UseSkiGameProps) {
  const gameStateRef = useRef<GameStateRef>({
    skierX: 300,
    skierY: 150,
    trees: [] as Tree[],
    speed: 140,
    score: 0,
    holding: false,
    nextDirection: "left",
    currentDirection: "down",
    rotation: 0,
    holdStartTime: 0,
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
    avalancheY: -200,
    avalancheSpeed: 120,
    gameStartTime: 0,
    backgroundOffset: 0,
  })

  const bestScoreRef = useRef(bestScore)

  useEffect(() => {
    bestScoreRef.current = bestScore
  }, [bestScore])

  const gameLoop = useCallback(
    (timestamp: number) => {
      const state = gameStateRef.current
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d", {
        alpha: false,
        desynchronized: true,
      })
      if (!ctx) return

      // High-DPI scaling - limit to 2x on mobile for performance
      const rawDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      const isMobileDevice = canvasWidth <= 768 || (canvasWidth < canvasHeight && canvasWidth <= 1024)
      const dpr = isMobileDevice ? Math.min(rawDpr, 2) : rawDpr

      const desiredWidth = canvasWidth * dpr
      const desiredHeight = canvasHeight * dpr
      if (canvas.width !== desiredWidth || canvas.height !== desiredHeight) {
        canvas.width = desiredWidth
        canvas.height = desiredHeight
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      // Optimize canvas rendering for performance
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "low"

      const deltaTime = state.lastFrameTime ? (timestamp - state.lastFrameTime) / 1000 : 0
      state.lastFrameTime = timestamp

      const elapsedTime = state.gameStartTime ? (timestamp - state.gameStartTime) / 1000 : 0

      // Update background offset based on speed (same as trees move)
      state.backgroundOffset += state.speed * deltaTime
      drawBackground(ctx, canvasWidth, canvasHeight, state.backgroundOffset)

      state.avalancheSpeed = Math.min(
        AVALANCHE_BASE_SPEED + AVALANCHE_ACCELERATION * elapsedTime,
        AVALANCHE_MAX_SPEED,
      )
      state.avalancheY += state.avalancheSpeed * deltaTime

      const speedFactor = (state.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)
      const turnAcceleration = BASE_TURN_ACCELERATION * (1 + speedFactor * 1.5)

      if (state.holding) {
        if (state.holdStartTime === 0) {
          state.holdStartTime = timestamp
        }

        const holdDuration = (timestamp - state.holdStartTime) / 1000
        
        // Calculate rotation progress: 0-1 for initial turn, continues beyond 1 for extended turn
        let rotationProgress = 0
        if (holdDuration <= TURN_PROGRESSION_TIME) {
          // Initial turn: 0 to MAX_ROTATION
          rotationProgress = holdDuration / TURN_PROGRESSION_TIME
        } else {
          // Extended turn: continue from MAX_ROTATION to MAX_EXTENDED_ROTATION
          const extendedProgress = Math.min(
            (holdDuration - TURN_PROGRESSION_TIME) / EXTENDED_TURN_TIME,
            1
          )
          rotationProgress = 1 + extendedProgress * ((MAX_EXTENDED_ROTATION / MAX_ROTATION) - 1)
        }

        // Calculate target rotation for speed calculation
        const targetRotationAbs = Math.abs(MAX_ROTATION * rotationProgress)
        const maxRotationAbs = Math.abs(MAX_EXTENDED_ROTATION)
        
        // Speed penalty based on rotation: more rotation = more speed loss
        // Normalize rotation (0 = straight, 1 = horizontal)
        const rotationFactor = targetRotationAbs / maxRotationAbs
        const speedPenalty = SPEED_DECELERATION * (1 + rotationFactor * ROTATION_SPEED_PENALTY)
        
        state.speed = Math.max(state.speed - speedPenalty * deltaTime, MIN_SPEED)

        // Increase max velocity as rotation increases (allows stronger horizontal movement)
        const rotationMultiplier = 1 + (rotationProgress - 1) * 2 // Scales up for extended turns
        const speedBasedMaxVelocity = MAX_TURN_VELOCITY * (0.4 + speedFactor * 1.2) * rotationMultiplier * HORIZONTAL_SPEED_MULTIPLIER

        if (state.nextDirection === "left") {
          state.velocityX -= turnAcceleration * rotationMultiplier * HORIZONTAL_SPEED_MULTIPLIER
          state.targetRotation = -MAX_ROTATION * rotationProgress
          state.currentDirection = "left"
        } else {
          state.velocityX += turnAcceleration * rotationMultiplier * HORIZONTAL_SPEED_MULTIPLIER
          state.targetRotation = MAX_ROTATION * rotationProgress
          state.currentDirection = "right"
        }
        state.velocityX = Math.max(-speedBasedMaxVelocity, Math.min(speedBasedMaxVelocity, state.velocityX))
      } else {
        state.holdStartTime = 0

        // Speed recovery based on current rotation: less rotation = faster recovery
        const currentRotationAbs = Math.abs(state.rotation)
        const maxRotationAbs = Math.abs(MAX_EXTENDED_ROTATION)
        const rotationFactor = currentRotationAbs / maxRotationAbs
        
        // Recovery speed: faster when more straight (less rotation)
        // When rotation is 0, full acceleration. When rotation is high, slower recovery
        const recoveryMultiplier = 1 - rotationFactor * 0.5 // Reduces recovery by up to 50% when highly rotated
        state.speed = Math.min(state.speed + SPEED_ACCELERATION * recoveryMultiplier * deltaTime, MAX_SPEED)

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

      const SPEED_THRESHOLD_MAX = MAX_SPEED
      const SKIER_Y_MIN = canvasHeight * 0.75 // 25% from bottom (fast)
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

      // Curved movement: rotation angle influences horizontal movement
      // This creates an arc/curve instead of straight sideways movement
      const rotationInfluence = Math.sin(state.rotation) * CURVE_FACTOR * state.speed * HORIZONTAL_SPEED_MULTIPLIER
      state.skierX += (state.velocityX + rotationInfluence) * deltaTime

      // Trail spacing and aging
      const lastTrail = state.trail[state.trail.length - 1]
      const distanceFromLast =
        lastTrail != null
          ? Math.sqrt((state.skierX - lastTrail.x) ** 2 + (state.skierY - lastTrail.y) ** 2)
          : TRAIL_SPACING + 1

      if (distanceFromLast >= TRAIL_SPACING) {
        state.trail.push({
          x: state.skierX,
          y: state.skierY,
          timestamp,
        })
      }

      // Age out trail points and move them upwards in-place
      const trail = state.trail
      const dyTrail = state.speed * deltaTime
      let trailWriteIndex = 0
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i]
        if (timestamp - p.timestamp < TRAIL_MAX_AGE) {
          p.y -= dyTrail
          trail[trailWriteIndex++] = p
        }
      }
      trail.length = trailWriteIndex

      const spawnInterval =
        state.speed >= 260 ? SPAWN_INTERVAL_FAST : state.speed >= 200 ? SPAWN_INTERVAL_MEDIUM : BASE_SPAWN_INTERVAL

      if (timestamp - state.lastTreeSpawn > spawnInterval) {
        const newTree: Tree = {
          x: Math.random() * (canvasWidth - 100) + 50,
          y: canvasHeight + 50,
          id: state.treeIdCounter++,
        }
        state.trees.push(newTree)
        state.lastTreeSpawn = timestamp
      }

      // Trees: in-place update
      const trees = state.trees
      const dy = state.speed * deltaTime
      let writeIndex = 0
      for (let i = 0; i < trees.length; i++) {
        const tree = trees[i]
        tree.y -= dy
        if (tree.y > -100) {
          trees[writeIndex++] = tree
        }
      }
      trees.length = writeIndex

      // Avalanche moves relative to world
      state.avalancheY -= state.speed * deltaTime

      drawAvalanche(ctx, state.avalancheY, state.cameraShakeX, state.cameraShakeY, timestamp, canvasWidth, canvasHeight)

      drawTrail(ctx, state.trail, timestamp, state.cameraShakeX, state.cameraShakeY)

      // Draw tree trunks first (behind skier)
      state.trees.forEach((tree) => drawTreeTrunk(ctx, tree.x, tree.y, state.cameraShakeX, state.cameraShakeY))

      // Draw skier (goes behind tree triangles)
      drawSkier(
        ctx,
        state.skierX,
        state.skierY,
        state.rotation,
        state.cameraShakeX,
        state.cameraShakeY,
        sprite,
        spriteLoaded,
        frameWidth,
        frameHeight,
      )

      // Draw tree triangles last (in front of skier)
      state.trees.forEach((tree) => drawTreeTriangle(ctx, tree.x, tree.y, state.cameraShakeX, state.cameraShakeY))

      // Avalanche catch
      if (state.avalancheY >= state.skierY - 30) {
        const finalScore = Math.floor(state.score)
        if (state.score > bestScoreRef.current) {
          localStorage.setItem("skiGameBestScore", finalScore.toString())
        }
        onGameOver(finalScore)
        return
      }

      // Tree/edge collision
      if (checkCollision(state.skierX, state.skierY, state.trees, canvasWidth)) {
        const finalScore = Math.floor(state.score)
        if (state.score > bestScoreRef.current) {
          localStorage.setItem("skiGameBestScore", finalScore.toString())
        }
        onGameOver(finalScore)
        return
      }

      state.score += (state.speed / 100) * deltaTime

      // HUD
      ctx.fillStyle = "#1f2937"
      ctx.font = "bold 20px Geist, sans-serif"
      ctx.fillText(`${Math.floor(state.score)}m`, 20, 40)

      if (canvasWidth > 400) {
        ctx.font = "16px Geist, sans-serif"
        ctx.fillText(`${Math.floor(state.speed)} px/s`, 20, 65)
      }

      const arrow = state.currentDirection === "left" ? "⬅" : state.currentDirection === "right" ? "➡" : "↓"
      ctx.font = "32px sans-serif"
      ctx.fillText(arrow, canvasWidth - 60, 45)

      state.animationFrameId = requestAnimationFrame(gameLoop)
    },
    [
      canvasRef,
      canvasWidth,
      canvasHeight,
      sprite,
      spriteLoaded,
      frameWidth,
      frameHeight,
      onGameOver,
    ],
  )

  const startGame = useCallback(() => {
    const state = gameStateRef.current

    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
    }

    state.skierX = canvasWidth / 2
    state.skierY = 150
    state.trees = []
    state.speed = BASE_SPEED
    state.score = 0
    state.holding = false
    state.nextDirection = "left"
    state.currentDirection = "down"
    state.rotation = 0
    state.targetRotation = 0
    state.holdStartTime = 0
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
    state.backgroundOffset = 0

    state.animationFrameId = requestAnimationFrame(gameLoop)
  }, [gameLoop, canvasWidth])

  const handlePointerDown = useCallback(() => {
    const state = gameStateRef.current
    if (!state.holding) {
      state.holding = true
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    const state = gameStateRef.current
    if (state.holding) {
      state.holding = false
      state.nextDirection = state.nextDirection === "left" ? "right" : "left"
    }
  }, [])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (gameStateRef.current.animationFrameId) {
        cancelAnimationFrame(gameStateRef.current.animationFrameId)
      }
    }
  }, [])

  return {
    startGame,
    handlePointerDown,
    handlePointerUp,
    score: Math.floor(gameStateRef.current.score),
    speed: Math.floor(gameStateRef.current.speed),
    currentDirection: gameStateRef.current.currentDirection,
  }
}

