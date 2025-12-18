import { useRef, useCallback, useEffect } from "react"
import type { GameStateRef, Tree, TrailPoint, Jump, NPCSkier } from "@/lib/gameTypes"
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
  SKIER_SIZE,
  SPEED_THRESHOLD_MIN,
  AVALANCHE_BASE_SPEED,
  AVALANCHE_ACCELERATION,
  AVALANCHE_MAX_SPEED,
  INITIAL_SKIER_X,
  INITIAL_SKIER_Y,
  INITIAL_SPEED,
  INITIAL_AVALANCHE_Y,
  TURN_ACCELERATION_SPEED_FACTOR,
  MAX_VELOCITY_BASE_MULTIPLIER,
  MAX_VELOCITY_SPEED_MULTIPLIER,
  ROTATION_MULTIPLIER_SCALE,
  SPEED_RECOVERY_ROTATION_PENALTY,
  SKIER_Y_INTERPOLATION_RATE,
  SKIER_Y_MIN_PERCENTAGE,
  VELOCITY_STOP_THRESHOLD,
  CAMERA_SHAKE_SPEED_THRESHOLD,
  CAMERA_SHAKE_INTENSITY,
  CAMERA_SHAKE_MAX_SPEED_OFFSET,
  TREE_SPAWN_SPEED_FAST,
  TREE_SPAWN_SPEED_MEDIUM,
  TREE_SPAWN_X_MARGIN,
  TREE_SPAWN_X_OFFSET,
  TREE_SPAWN_Y_OFFSET,
  TREE_CLEANUP_Y_THRESHOLD,
  AVALANCHE_CATCH_THRESHOLD,
  EDGE_COLLISION_MARGIN,
  SCORE_SPEED_DIVISOR,
  SCORE_PER_LEVEL,
  LEVEL_SPAWN_INTERVAL_REDUCTION,
  LEVEL_MIN_SPAWN_INTERVAL,
  LEVEL_TREE_DENSITY_MULTIPLIER,
  LEVEL_MAX_TREES_ON_SCREEN,
  LEVEL_SPEED_BONUS,
  LEVEL_AVALANCHE_ACCELERATION_BONUS,
  LEVEL_TREE_SPAWN_THRESHOLD_REDUCTION,
  JUMP_WIDTH,
  JUMP_HEIGHT,
  JUMP_DISTANCE_FROM_TREE,
  JUMP_SPAWN_CHANCE,
  JUMP_LAUNCH_VELOCITY,
  JUMP_GRAVITY,
  JUMP_CLEAR_HEIGHT,
  JUMP_COLLISION_WIDTH,
  JUMP_MAX_SCALE,
  NPC_BEGINNER_SPEED,
  NPC_BEGINNER_TURN_ACCELERATION,
  NPC_BEGINNER_MAX_ROTATION,
  NPC_BEGINNER_TURN_INTERVAL_MIN,
  NPC_BEGINNER_TURN_INTERVAL_MAX,
  NPC_BEGINNER_ROTATION_SPEED,
  NPC_BEGINNER_TURN_DAMPING,
  NPC_BEGINNER_MAX_VELOCITY,
  NPC_BEGINNER_SPAWN_INTERVAL,
  NPC_BEGINNER_TREE_AVOIDANCE_DISTANCE,
  NPC_BEGINNER_TREE_AVOIDANCE_FORCE,
  NPC_BEGINNER_EDGE_AVOIDANCE_DISTANCE,
  NPC_BEGINNER_EDGE_AVOIDANCE_FORCE,
} from "@/lib/gameConstants"
import {
  drawBackground,
  drawTrail,
  drawSkier,
  drawNPCSkier,
  drawTreeTrunk,
  drawTreeTriangle,
  drawAvalanche,
  drawJump,
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
  treeSprite: HTMLImageElement | null
  treeSpriteLoaded: boolean
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
  treeSprite,
  treeSpriteLoaded,
  onGameOver,
  bestScore,
}: UseSkiGameProps) {
  const gameStateRef = useRef<GameStateRef>({
    skierX: INITIAL_SKIER_X,
    skierY: INITIAL_SKIER_Y,
    trees: [] as Tree[],
    jumps: [] as Jump[],
    npcSkiers: [] as NPCSkier[],
    speed: INITIAL_SPEED,
    score: 0,
    level: 1,
    holding: false,
    nextDirection: "left",
    currentDirection: "down",
    rotation: 0,
    holdStartTime: 0,
    targetRotation: 0,
    velocityX: 0,
    jumpHeight: 0,
    jumpVelocity: 0,
    isJumping: false,
    treeIdCounter: 0,
    jumpIdCounter: 0,
    npcSkierIdCounter: 0,
    lastTreeSpawn: 0,
    lastNPCSkierSpawn: 0,
    animationFrameId: 0,
    lastFrameTime: 0,
    trail: [] as TrailPoint[],
    lastTrailPoint: 0,
    cameraShakeX: 0,
    cameraShakeY: 0,
    avalancheY: INITIAL_AVALANCHE_Y,
    avalancheSpeed: AVALANCHE_BASE_SPEED,
    gameStartTime: 0,
    backgroundOffset: 0,
  })

  const bestScoreRef = useRef(bestScore)

  useEffect(() => {
    bestScoreRef.current = bestScore
  }, [bestScore])

  const gameLoop = useCallback(
    (timestamp: number) => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e8dc53c2-40aa-4d5f-89d5-928701eee6d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSkiGame.ts:144',message:'GameLoop entry',data:{timestamp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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

      // Apply level-based avalanche acceleration bonus
      const levelAvalancheAcceleration = AVALANCHE_ACCELERATION + (state.level - 1) * LEVEL_AVALANCHE_ACCELERATION_BONUS
      state.avalancheSpeed = Math.min(
        AVALANCHE_BASE_SPEED + levelAvalancheAcceleration * elapsedTime,
        AVALANCHE_MAX_SPEED,
      )
      state.avalancheY += state.avalancheSpeed * deltaTime

      const speedFactor = (state.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)
      const turnAcceleration = BASE_TURN_ACCELERATION * (1 + speedFactor * TURN_ACCELERATION_SPEED_FACTOR)

      // During jumps, preserve horizontal velocity but still allow rotation changes (visual only)
      if (!state.isJumping) {
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
          const rotationMultiplier = 1 + (rotationProgress - 1) * ROTATION_MULTIPLIER_SCALE // Scales up for extended turns
          const speedBasedMaxVelocity = MAX_TURN_VELOCITY * (MAX_VELOCITY_BASE_MULTIPLIER + speedFactor * MAX_VELOCITY_SPEED_MULTIPLIER) * rotationMultiplier * HORIZONTAL_SPEED_MULTIPLIER

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
          const recoveryMultiplier = 1 - rotationFactor * SPEED_RECOVERY_ROTATION_PENALTY // Reduces recovery when highly rotated
          state.speed = Math.min(state.speed + SPEED_ACCELERATION * recoveryMultiplier * deltaTime, MAX_SPEED)

          state.velocityX *= TURN_DAMPING
          state.targetRotation = 0
          state.currentDirection = "down"

          if (Math.abs(state.velocityX) < VELOCITY_STOP_THRESHOLD) {
            state.velocityX = 0
          }
        }
      } else {
        // While jumping: allow rotation changes (visual only) but preserve horizontal velocity
        // Rotation can still change based on input, but velocityX remains constant
        if (state.holding) {
          if (state.holdStartTime === 0) {
            state.holdStartTime = timestamp
          }

          const holdDuration = (timestamp - state.holdStartTime) / 1000
          
          // Calculate rotation progress: 0-1 for initial turn, continues beyond 1 for extended turn
          let rotationProgress = 0
          if (holdDuration <= TURN_PROGRESSION_TIME) {
            rotationProgress = holdDuration / TURN_PROGRESSION_TIME
          } else {
            const extendedProgress = Math.min(
              (holdDuration - TURN_PROGRESSION_TIME) / EXTENDED_TURN_TIME,
              1
            )
            rotationProgress = 1 + extendedProgress * ((MAX_EXTENDED_ROTATION / MAX_ROTATION) - 1)
          }

          // Update target rotation for visual effect only (no velocity change)
          if (state.nextDirection === "left") {
            state.targetRotation = -MAX_ROTATION * rotationProgress
            state.currentDirection = "left"
          } else {
            state.targetRotation = MAX_ROTATION * rotationProgress
            state.currentDirection = "right"
          }
        } else {
          state.holdStartTime = 0
          // Gradually return to straight rotation while in air
          state.targetRotation = 0
          state.currentDirection = "down"
        }
        // velocityX is preserved - no changes while jumping
      }

      state.rotation += (state.targetRotation - state.rotation) * ROTATION_SPEED

      const shakeIntensity = Math.max(0, (state.speed - CAMERA_SHAKE_SPEED_THRESHOLD) / (MAX_SPEED - CAMERA_SHAKE_MAX_SPEED_OFFSET)) * CAMERA_SHAKE_INTENSITY
      state.cameraShakeX = (Math.random() - 0.5) * shakeIntensity
      state.cameraShakeY = (Math.random() - 0.5) * shakeIntensity

      const SPEED_THRESHOLD_MAX = MAX_SPEED
      const SKIER_Y_MIN = canvasHeight * SKIER_Y_MIN_PERCENTAGE // Position from bottom based on speed
      if (state.speed >= SPEED_THRESHOLD_MIN) {
        const speedProgress = Math.min(
          1,
          (state.speed - SPEED_THRESHOLD_MIN) / (SPEED_THRESHOLD_MAX - SPEED_THRESHOLD_MIN),
        )
        const targetY = SKIER_Y_MAX + (SKIER_Y_MIN - SKIER_Y_MAX) * speedProgress
        state.skierY += (targetY - state.skierY) * SKIER_Y_INTERPOLATION_RATE
      } else {
        state.skierY += (SKIER_Y_MAX - state.skierY) * SKIER_Y_INTERPOLATION_RATE
      }

      // Jump physics
      if (state.isJumping) {
        const oldHeight = state.jumpHeight
        state.jumpVelocity -= JUMP_GRAVITY * deltaTime // Apply gravity
        state.jumpHeight += state.jumpVelocity * deltaTime
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/e8dc53c2-40aa-4d5f-89d5-928701eee6d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSkiGame.ts:281',message:'Jump physics update',data:{isJumping:state.isJumping,oldHeight,jumpHeight:state.jumpHeight,jumpVelocity:state.jumpVelocity,deltaTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Land when jump height reaches 0
        if (state.jumpHeight <= 0) {
          state.jumpHeight = 0
          state.jumpVelocity = 0
          state.isJumping = false
        }
      } else {
        // Check for jump ramp collision
        for (const jump of state.jumps) {
          const jumpLeft = jump.x - JUMP_COLLISION_WIDTH / 2
          const jumpRight = jump.x + JUMP_COLLISION_WIDTH / 2
          const jumpTop = jump.y - JUMP_HEIGHT
          const jumpBottom = jump.y
          
          const skierLeft = state.skierX - SKIER_SIZE / 2
          const skierRight = state.skierX + SKIER_SIZE / 2
          const skierBottom = state.skierY + SKIER_SIZE / 2
          const skierTop = state.skierY - SKIER_SIZE / 2
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/e8dc53c2-40aa-4d5f-89d5-928701eee6d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSkiGame.ts:296',message:'Jump collision check',data:{jumpX:jump.x,jumpY:jump.y,jumpLeft,jumpRight,jumpTop,jumpBottom,skierX:state.skierX,skierY:state.skierY,skierLeft,skierRight,skierTop,skierBottom},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          // Check if skier hits jump ramp (collision - skier's bottom should be near jump's top surface)
          // The jump ramp has a sloped top, so we check if skier's bottom is within the jump's vertical bounds
          if (
            skierRight > jumpLeft &&
            skierLeft < jumpRight &&
            skierBottom >= jumpTop - 5 && // Skier bottom is at or slightly above jump top (with tolerance)
            skierBottom <= jumpBottom + 10 // And at or below jump bottom (allow landing on ramp)
          ) {
            // #region agent log
            fetch('http://127.0.0.1:7244/ingest/e8dc53c2-40aa-4d5f-89d5-928701eee6d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSkiGame.ts:311',message:'Jump collision detected',data:{jumpX:jump.x,jumpY:jump.y,skierX:state.skierX,skierY:state.skierY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            state.isJumping = true
            state.jumpVelocity = JUMP_LAUNCH_VELOCITY
            state.jumpHeight = 0 // Start jump from ground level
            break
          }
        }
      }

      // Curved movement: rotation angle influences horizontal movement
      // This creates an arc/curve instead of straight sideways movement
      // While jumping, only use velocityX (preserved from launch) - no rotation influence
      if (state.isJumping) {
        state.skierX += state.velocityX * deltaTime
      } else {
        const rotationInfluence = Math.sin(state.rotation) * CURVE_FACTOR * state.speed * HORIZONTAL_SPEED_MULTIPLIER
        state.skierX += (state.velocityX + rotationInfluence) * deltaTime
      }

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

      // Calculate base spawn interval
      const baseSpawnInterval =
        state.speed >= TREE_SPAWN_SPEED_FAST ? SPAWN_INTERVAL_FAST : state.speed >= TREE_SPAWN_SPEED_MEDIUM ? SPAWN_INTERVAL_MEDIUM : BASE_SPAWN_INTERVAL
      
      // Apply level-based difficulty: spawn intervals get shorter (trees spawn more frequently)
      // First apply the exponential interval reduction
      const intervalReduction = Math.pow(LEVEL_SPAWN_INTERVAL_REDUCTION, state.level - 1)
      // Then apply tree density multiplier (higher density = more trees = shorter intervals)
      // Density multiplier is exponential: each level multiplies the effect
      const densityMultiplier = Math.pow(LEVEL_TREE_DENSITY_MULTIPLIER, state.level - 1)
      // Higher density means shorter intervals, so divide by density multiplier
      const levelMultiplier = (intervalReduction / densityMultiplier)
      const spawnInterval = Math.max(
        baseSpawnInterval * levelMultiplier,
        LEVEL_MIN_SPAWN_INTERVAL,
      )

      // Check if we can spawn a new tree (respect max trees limit if set)
      const maxTreesForLevel = LEVEL_MAX_TREES_ON_SCREEN > 0 ? LEVEL_MAX_TREES_ON_SCREEN : Infinity
      const canSpawnTree = state.trees.length < maxTreesForLevel

      if (canSpawnTree && timestamp - state.lastTreeSpawn > spawnInterval) {
        const treeX = Math.random() * (canvasWidth - TREE_SPAWN_X_MARGIN) + TREE_SPAWN_X_OFFSET
        const treeY = canvasHeight + TREE_SPAWN_Y_OFFSET
        const newTree: Tree = {
          x: treeX,
          y: treeY,
          id: state.treeIdCounter++,
        }
        state.trees.push(newTree)
        
        // Spawn a jump in front of the tree with a chance
        if (Math.random() < JUMP_SPAWN_CHANCE) {
          const jumpY = treeY - JUMP_DISTANCE_FROM_TREE // Jump spawns ABOVE tree (lower Y = higher on screen)
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/e8dc53c2-40aa-4d5f-89d5-928701eee6d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSkiGame.ts:385',message:'Jump spawn FIXED',data:{treeY,jumpY,treeX,JUMP_DISTANCE_FROM_TREE},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          const newJump: Jump = {
            x: treeX,
            y: jumpY,
            id: state.jumpIdCounter++,
            treeId: newTree.id,
          }
          state.jumps.push(newJump)
        }
        
        state.lastTreeSpawn = timestamp
      }

      // Trees: in-place update
      const trees = state.trees
      const dy = state.speed * deltaTime
      let writeIndex = 0
      for (let i = 0; i < trees.length; i++) {
        const tree = trees[i]
        tree.y -= dy
        if (tree.y > TREE_CLEANUP_Y_THRESHOLD) {
          trees[writeIndex++] = tree
        }
      }
      trees.length = writeIndex

      // Jumps: in-place update (move with world, same as trees)
      const jumps = state.jumps
      let jumpWriteIndex = 0
      for (let i = 0; i < jumps.length; i++) {
        const jump = jumps[i]
        jump.y -= dy
        if (jump.y > TREE_CLEANUP_Y_THRESHOLD) {
          jumps[jumpWriteIndex++] = jump
        }
      }
      jumps.length = jumpWriteIndex

      // NPC Skier Spawning
      if (timestamp - state.lastNPCSkierSpawn > NPC_BEGINNER_SPAWN_INTERVAL) {
        const npcX = Math.random() * (canvasWidth - TREE_SPAWN_X_MARGIN) + TREE_SPAWN_X_OFFSET
        const npcY = canvasHeight + TREE_SPAWN_Y_OFFSET
        const initialTurnDirection = Math.random() < 0.5 ? "left" : "right"
        const initialTurnTimer = NPC_BEGINNER_TURN_INTERVAL_MIN + Math.random() * (NPC_BEGINNER_TURN_INTERVAL_MAX - NPC_BEGINNER_TURN_INTERVAL_MIN)
        
        const newNPCSkier: NPCSkier = {
          x: npcX,
          y: npcY,
          id: state.npcSkierIdCounter++,
          rotation: 0,
          targetRotation: 0,
          velocityX: 0,
          speed: NPC_BEGINNER_SPEED,
          turnDirection: initialTurnDirection,
          turnTimer: initialTurnTimer,
          type: "beginner",
        }
        state.npcSkiers.push(newNPCSkier)
        state.lastNPCSkierSpawn = timestamp
      }

      // NPC Skier AI Update
      const npcSkiers = state.npcSkiers
      let npcWriteIndex = 0
      for (let i = 0; i < npcSkiers.length; i++) {
        const npc = npcSkiers[i]
        
        // Move NPC: world moves up at player speed, but NPC moves down at their own speed
        // Net movement = world speed - NPC speed (if NPC is slower, they move up slower)
        const npcDy = (state.speed - npc.speed) * deltaTime
        npc.y -= npcDy
        
        // Skip if NPC is off screen
        if (npc.y > TREE_CLEANUP_Y_THRESHOLD) {
          // Update turn timer
          npc.turnTimer -= deltaTime
          
          // Change turn direction when timer expires
          if (npc.turnTimer <= 0) {
            npc.turnDirection = npc.turnDirection === "left" ? "right" : "left"
            npc.turnTimer = NPC_BEGINNER_TURN_INTERVAL_MIN + Math.random() * (NPC_BEGINNER_TURN_INTERVAL_MAX - NPC_BEGINNER_TURN_INTERVAL_MIN)
          }
          
          // Tree avoidance: check for nearby trees (only when very close)
          let avoidanceForceX = 0
          for (const tree of state.trees) {
            const dx = tree.x - npc.x
            const dy = tree.y - npc.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            // Only avoid if very close (reduced distance for less interference)
            if (distance < NPC_BEGINNER_TREE_AVOIDANCE_DISTANCE * 0.6 && distance > 0) {
              // Steer away from tree (opposite direction)
              const force = NPC_BEGINNER_TREE_AVOIDANCE_FORCE / (distance + 1) // Inverse distance force
              avoidanceForceX -= (dx / distance) * force
            }
          }
          
          // Edge avoidance: steer away from edges (only when very close)
          const distanceToLeftEdge = npc.x - EDGE_COLLISION_MARGIN
          const distanceToRightEdge = canvasWidth - EDGE_COLLISION_MARGIN - npc.x
          
          if (distanceToLeftEdge < NPC_BEGINNER_EDGE_AVOIDANCE_DISTANCE * 0.7) {
            avoidanceForceX += NPC_BEGINNER_EDGE_AVOIDANCE_FORCE / (distanceToLeftEdge + 1)
          }
          if (distanceToRightEdge < NPC_BEGINNER_EDGE_AVOIDANCE_DISTANCE * 0.7) {
            avoidanceForceX -= NPC_BEGINNER_EDGE_AVOIDANCE_FORCE / (distanceToRightEdge + 1)
          }
          
          // Apply turning behavior (zigzag pattern) - use target velocity approach
          // Set target velocity based on turn direction, then accelerate towards it
          const targetVelocity = npc.turnDirection === "left" 
            ? -NPC_BEGINNER_MAX_VELOCITY * 0.7  // Target 70% of max velocity for visible turning
            : NPC_BEGINNER_MAX_VELOCITY * 0.7
          
          // Accelerate towards target velocity - use stronger acceleration to overcome damping
          const velocityDiff = targetVelocity - npc.velocityX
          // Use proportional acceleration: the larger the difference, the stronger the acceleration
          // For large differences, use a higher multiplier to reach target quickly
          const accelerationMultiplier = Math.abs(velocityDiff) > 20 ? 8.0 : 15.0
          const turnAcceleration = Math.sign(velocityDiff) * Math.min(Math.abs(velocityDiff) * accelerationMultiplier, NPC_BEGINNER_TURN_ACCELERATION)
          
          // Apply turning force, then add avoidance (turning has priority)
          const avoidanceWeight = Math.abs(avoidanceForceX) > 0 ? 0.3 : 0 // Only apply avoidance when needed
          npc.velocityX += (turnAcceleration + avoidanceForceX * avoidanceWeight) * deltaTime
          
          // Apply minimal damping only when not actively turning
          if (Math.abs(npc.velocityX) < 0.1) {
            npc.velocityX *= 0.98 // Very light damping when stopped
          } else {
            npc.velocityX *= NPC_BEGINNER_TURN_DAMPING
          }
          
          // Clamp velocity
          npc.velocityX = Math.max(-NPC_BEGINNER_MAX_VELOCITY, Math.min(NPC_BEGINNER_MAX_VELOCITY, npc.velocityX))
          
          // Update rotation based on velocity - more direct mapping for pronounced turns
          // Map velocity to rotation: full velocity = full rotation
          const normalizedVelocity = npc.velocityX / NPC_BEGINNER_MAX_VELOCITY
          npc.targetRotation = normalizedVelocity * NPC_BEGINNER_MAX_ROTATION
          npc.rotation += (npc.targetRotation - npc.rotation) * NPC_BEGINNER_ROTATION_SPEED
          
          // Update horizontal position
          npc.x += npc.velocityX * deltaTime
          
          // Keep NPC within bounds
          npc.x = Math.max(EDGE_COLLISION_MARGIN + SKIER_SIZE / 2, Math.min(canvasWidth - EDGE_COLLISION_MARGIN - SKIER_SIZE / 2, npc.x))
          
          npcSkiers[npcWriteIndex++] = npc
        }
      }
      npcSkiers.length = npcWriteIndex

      // Avalanche moves relative to world
      state.avalancheY -= state.speed * deltaTime

      drawAvalanche(ctx, state.avalancheY, state.cameraShakeX, state.cameraShakeY, timestamp, canvasWidth, canvasHeight)

      drawTrail(ctx, state.trail, timestamp, state.cameraShakeX, state.cameraShakeY)

      // Draw jumps first (behind everything)
      state.jumps.forEach((jump) => drawJump(ctx, jump.x, jump.y, state.cameraShakeX, state.cameraShakeY))

      // Draw tree trunks (behind skier)
      state.trees.forEach((tree) => drawTreeTrunk(ctx, tree.x, tree.y, state.cameraShakeX, state.cameraShakeY, treeSprite, treeSpriteLoaded))

      // Draw NPC skiers (behind player skier)
      state.npcSkiers.forEach((npc) => drawNPCSkier(ctx, npc, state.cameraShakeX, state.cameraShakeY, sprite, spriteLoaded, frameWidth, frameHeight))

      // Draw skier and trees based on jump height for proper layering
      const skierDrawY = state.skierY - state.jumpHeight
      const isJumpingHigh = state.jumpHeight >= JUMP_CLEAR_HEIGHT
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/e8dc53c2-40aa-4d5f-89d5-928701eee6d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useSkiGame.ts:437',message:'Skier draw position',data:{skierY:state.skierY,jumpHeight:state.jumpHeight,skierDrawY,isJumping:state.isJumping},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      // If jumping high, draw trees first, then skier on top
      // If not jumping, draw skier first, then trees on top (normal layering)
      if (isJumpingHigh) {
        // Draw tree triangles first (behind jumping skier)
        state.trees.forEach((tree) => drawTreeTriangle(ctx, tree.x, tree.y, state.cameraShakeX, state.cameraShakeY, treeSprite, treeSpriteLoaded))
        
        // Draw skier on top (appears above trees)
        drawSkier(
          ctx,
          state.skierX,
          skierDrawY,
          state.rotation,
          state.cameraShakeX,
          state.cameraShakeY,
          sprite,
          spriteLoaded,
          frameWidth,
          frameHeight,
          state.jumpHeight, // Pass jump height for scaling effect
        )
      } else {
        // Draw skier first (normal layering)
        drawSkier(
          ctx,
          state.skierX,
          skierDrawY,
          state.rotation,
          state.cameraShakeX,
          state.cameraShakeY,
          sprite,
          spriteLoaded,
          frameWidth,
          frameHeight,
          state.jumpHeight, // Pass jump height for scaling effect
        )
        
        // Draw tree triangles last (in front of skier)
        state.trees.forEach((tree) => drawTreeTriangle(ctx, tree.x, tree.y, state.cameraShakeX, state.cameraShakeY, treeSprite, treeSpriteLoaded))
      }

      // Avalanche catch
      if (state.avalancheY >= state.skierY - AVALANCHE_CATCH_THRESHOLD) {
        const finalScore = Math.floor(state.score)
        if (state.score > bestScoreRef.current) {
          localStorage.setItem("skiGameBestScore", finalScore.toString())
        }
        onGameOver(finalScore)
        return
      }

      // Tree/edge/NPC collision (pass jump height to allow jumping over trees, but NPCs always collide)
      if (checkCollision(state.skierX, state.skierY, state.trees, canvasWidth, state.jumpHeight, state.npcSkiers)) {
        const finalScore = Math.floor(state.score)
        if (state.score > bestScoreRef.current) {
          localStorage.setItem("skiGameBestScore", finalScore.toString())
        }
        onGameOver(finalScore)
        return
      }

      state.score += (state.speed / SCORE_SPEED_DIVISOR) * deltaTime

      // Calculate current level based on score (after score update)
      const newLevel = Math.floor(state.score / SCORE_PER_LEVEL) + 1
      if (newLevel > state.level) {
        state.level = newLevel
      }

      // HUD
      ctx.fillStyle = "#1f2937"
      ctx.font = "bold 20px Geist, sans-serif"
      ctx.fillText(`${Math.floor(state.score)}m`, 20, 40)

      if (canvasWidth > 400) {
        ctx.font = "16px Geist, sans-serif"
        ctx.fillText(`${Math.floor(state.speed)} px/s`, 20, 65)
        ctx.fillText(`Level ${state.level}`, 20, 85)
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
    state.skierY = INITIAL_SKIER_Y
    state.trees = []
    state.jumps = []
    state.npcSkiers = []
    state.speed = BASE_SPEED
    state.score = 0
    state.level = 1
    state.holding = false
    state.nextDirection = "left"
    state.currentDirection = "down"
    state.rotation = 0
    state.targetRotation = 0
    state.holdStartTime = 0
    state.velocityX = 0
    state.jumpHeight = 0
    state.jumpVelocity = 0
    state.isJumping = false
    state.treeIdCounter = 0
    state.jumpIdCounter = 0
    state.npcSkierIdCounter = 0
    state.lastTreeSpawn = 0
    state.lastNPCSkierSpawn = 0
    state.lastFrameTime = 0
    state.trail = []
    state.lastTrailPoint = 0
    state.cameraShakeX = 0
    state.cameraShakeY = 0
    state.avalancheY = INITIAL_AVALANCHE_Y
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
    level: gameStateRef.current.level,
    currentDirection: gameStateRef.current.currentDirection,
  }
}

