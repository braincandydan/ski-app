import type { TrailPoint, Tree, NPCSkier } from "./gameTypes"
import {
  SKIER_SIZE,
  MAX_ROTATION,
  TRAIL_MAX_AGE,
  TRAIL_LINE_WIDTH,
  TRAIL_OPACITY,
  TREE_TRUNK_WIDTH,
  TREE_TRUNK_HEIGHT,
  TREE_TRUNK_OFFSET_X,
  TREE_TRUNK_OFFSET_Y,
  EDGE_COLLISION_MARGIN,
  JUMP_WIDTH,
  JUMP_HEIGHT,
  JUMP_CLEAR_HEIGHT,
  JUMP_MAX_SCALE,
  AVALANCHE_DRAW_THRESHOLD,
  AVALANCHE_HEIGHT,
  AVALANCHE_GRADIENT_TOP_OFFSET,
  AVALANCHE_GRADIENT_BOTTOM_OFFSET,
  AVALANCHE_WARNING_Y_THRESHOLD,
  AVALANCHE_WARNING_HEIGHT_RATIO,
} from "./gameConstants"

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  backgroundOffset: number,
) {
  // Gradient background (cream to white)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  gradient.addColorStop(0, "#fefce8")
  gradient.addColorStop(1, "#ffffff")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Diagonal lines removed for testing
}

export function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  currentTime: number,
  cameraShakeX: number,
  cameraShakeY: number,
) {
  if (trail.length < 2) return

  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  for (let i = 0; i < trail.length - 1; i++) {
    const point = trail[i]
    const nextPoint = trail[i + 1]
    const age = currentTime - point.timestamp
    const opacity = Math.max(0, 1 - age / TRAIL_MAX_AGE)

    if (opacity > 0) {
      ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * TRAIL_OPACITY})`
      ctx.lineWidth = TRAIL_LINE_WIDTH
      ctx.beginPath()
      ctx.moveTo(point.x + cameraShakeX, point.y + cameraShakeY)
      ctx.lineTo(nextPoint.x + cameraShakeX, nextPoint.y + cameraShakeY)
      ctx.stroke()
    }
  }
}

export function drawNPCSkier(
  ctx: CanvasRenderingContext2D,
  npc: NPCSkier,
  cameraShakeX: number,
  cameraShakeY: number,
  sprite: HTMLImageElement | null,
  spriteLoaded: boolean,
  frameWidth: number,
  frameHeight: number,
) {
  const x = npc.x + cameraShakeX
  const y = npc.y + cameraShakeY
  const rotation = npc.rotation

  if (sprite && spriteLoaded && frameWidth > 0) {
    // Map rotation to frame index (same logic as player skier)
    const clampedRotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, rotation))
    const normalizedRotation = clampedRotation / MAX_ROTATION
    let frameIndex = Math.round((-normalizedRotation + 1) * 2)
    frameIndex = Math.max(0, Math.min(4, frameIndex))

    const sourceX = frameIndex * frameWidth
    const drawWidth = SKIER_SIZE
    const drawHeight = (frameHeight / frameWidth) * SKIER_SIZE

    ctx.save()
    ctx.translate(x, y)
    ctx.drawImage(
      sprite,
      sourceX,
      0,
      frameWidth,
      frameHeight,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight,
    )
    ctx.restore()
  } else {
    // Fallback to simple drawing for NPC skiers (slightly different color to distinguish)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    // NPC skier body (slightly different teal to distinguish from player)
    ctx.fillStyle = "#0d9488"
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
  }
}

export function drawSkier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  cameraShakeX: number,
  cameraShakeY: number,
  sprite: HTMLImageElement | null,
  spriteLoaded: boolean,
  frameWidth: number,
  frameHeight: number,
  jumpHeight: number = 0, // Jump height for scaling effect
) {
  if (sprite && spriteLoaded && frameWidth > 0) {
    // Map rotation to frame index
    // rotation can now exceed MAX_ROTATION (up to 90°), but sprite only has 5 frames
    // Clamp rotation to MAX_ROTATION range for sprite selection, but use actual rotation for movement
    const clampedRotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, rotation))
    const normalizedRotation = clampedRotation / MAX_ROTATION // -1 to +1
    // Invert the mapping: left rotation (-1) should show left sprite (frame 0), right rotation (+1) should show right sprite (frame 4)
    let frameIndex = Math.round((-normalizedRotation + 1) * 2) // 0 to 4, inverted
    frameIndex = Math.max(0, Math.min(4, frameIndex)) // Clamp to valid range

    const sourceX = frameIndex * frameWidth

    // Calculate scale based on jump height (higher = larger)
    // Scale from 1.0 (ground) to JUMP_MAX_SCALE (at peak height)
    const normalizedJumpHeight = Math.min(jumpHeight / JUMP_CLEAR_HEIGHT, 1) // Clamp to 0-1
    const scale = 1 + (JUMP_MAX_SCALE - 1) * normalizedJumpHeight

    // Draw sprite centered at position
    const drawWidth = SKIER_SIZE * scale
    const drawHeight = (frameHeight / frameWidth) * SKIER_SIZE * scale

    ctx.save()
    ctx.translate(x + cameraShakeX, y + cameraShakeY)
    // Don't rotate the sprite - the sprite sheet already has the angles
    ctx.drawImage(
      sprite,
      sourceX,
      0,
      frameWidth,
      frameHeight,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight,
    )
    ctx.restore()
  } else {
    // Fallback to original drawing if sprite not loaded
    // Calculate scale based on jump height (higher = larger)
    const normalizedJumpHeight = Math.min(jumpHeight / JUMP_CLEAR_HEIGHT, 1) // Clamp to 0-1
    const scale = 1 + (JUMP_MAX_SCALE - 1) * normalizedJumpHeight
    
    ctx.save()
    ctx.translate(x + cameraShakeX, y + cameraShakeY)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)

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
  }
}

export function drawTreeTrunk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cameraShakeX: number,
  cameraShakeY: number,
  treeSprite: HTMLImageElement | null = null,
  treeSpriteLoaded: boolean = false,
) {
  // If using tree sprite that includes trunk, don't draw separate trunk
  if (treeSprite && treeSpriteLoaded) {
    return
  }

  const shakeX = x + cameraShakeX
  const shakeY = y + cameraShakeY

  // Brown trunk (fallback if no sprite)
  ctx.fillStyle = "#92400e"
  ctx.fillRect(shakeX - TREE_TRUNK_OFFSET_X, shakeY + TREE_TRUNK_OFFSET_Y, TREE_TRUNK_WIDTH, TREE_TRUNK_HEIGHT)
}

export function drawTreeTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cameraShakeX: number,
  cameraShakeY: number,
  treeSprite: HTMLImageElement | null = null,
  treeSpriteLoaded: boolean = false,
) {
  const shakeX = x + cameraShakeX
  const shakeY = y + cameraShakeY

  // Use tree sprite if available and loaded
  if (treeSprite && treeSpriteLoaded) {
    // Tree image dimensions: 60px wide × 70px tall (or adjust based on your image)
    const TREE_IMAGE_WIDTH = 50
    const TREE_IMAGE_HEIGHT = 80
    
    // Draw tree image centered at tree position
    ctx.drawImage(
      treeSprite,
      shakeX - TREE_IMAGE_WIDTH / 2,
      shakeY - 30, // Align top of tree with original triangle top (y - 30)
      TREE_IMAGE_WIDTH,
      TREE_IMAGE_HEIGHT,
    )
    return
  }

  // Fallback to original programmatic drawing if sprite not loaded
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
}

export function drawJump(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cameraShakeX: number,
  cameraShakeY: number,
) {
  const shakeX = x + cameraShakeX
  const shakeY = y + cameraShakeY

  // Draw jump ramp as a sloped rectangle
  // Base (brown/dirt color)
  ctx.fillStyle = "#78350f"
  ctx.fillRect(shakeX - JUMP_WIDTH / 2, shakeY, JUMP_WIDTH, JUMP_HEIGHT)

  // Top slope (snow/white)
  ctx.fillStyle = "#f8fafc"
  ctx.beginPath()
  ctx.moveTo(shakeX - JUMP_WIDTH / 2, shakeY)
  ctx.lineTo(shakeX, shakeY - JUMP_HEIGHT)
  ctx.lineTo(shakeX + JUMP_WIDTH / 2, shakeY)
  ctx.closePath()
  ctx.fill()

  // Outline for visibility
  ctx.strokeStyle = "#64748b"
  ctx.lineWidth = 2
  ctx.strokeRect(shakeX - JUMP_WIDTH / 2, shakeY, JUMP_WIDTH, JUMP_HEIGHT)
  ctx.beginPath()
  ctx.moveTo(shakeX - JUMP_WIDTH / 2, shakeY)
  ctx.lineTo(shakeX, shakeY - JUMP_HEIGHT)
  ctx.lineTo(shakeX + JUMP_WIDTH / 2, shakeY)
  ctx.stroke()
}

export function drawAvalanche(
  ctx: CanvasRenderingContext2D,
  avalancheY: number,
  cameraShakeX: number,
  cameraShakeY: number,
  timestamp: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (avalancheY < AVALANCHE_DRAW_THRESHOLD) return // Don't draw if too far above screen

  const screenY = avalancheY + cameraShakeY

  // Create gradient for avalanche effect (white to gray)
  const gradient = ctx.createLinearGradient(0, screenY + AVALANCHE_GRADIENT_TOP_OFFSET, 0, screenY + AVALANCHE_GRADIENT_BOTTOM_OFFSET)
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)")
  gradient.addColorStop(0.4, "rgba(226, 232, 240, 0.7)")
  gradient.addColorStop(0.7, "rgba(203, 213, 225, 0.9)")
  gradient.addColorStop(1, "rgba(148, 163, 184, 1)")

  ctx.fillStyle = gradient
  ctx.fillRect(0, screenY + AVALANCHE_GRADIENT_TOP_OFFSET, canvasWidth, AVALANCHE_HEIGHT)

  // Add some cloud-like particles for effect
  ctx.fillStyle = "rgba(241, 245, 249, 0.8)"
  for (let i = 0; i < 8; i++) {
    const x = (i * canvasWidth) / 7 + Math.sin(timestamp / 500 + i) * 20
    const size = 30 + Math.sin(timestamp / 400 + i * 2) * 10
    ctx.beginPath()
    ctx.arc(
      x + cameraShakeX,
      screenY - 50 + Math.cos(timestamp / 600 + i) * 15,
      size,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // Warning text when avalanche is getting close
  if (screenY > AVALANCHE_WARNING_Y_THRESHOLD && screenY < canvasHeight * AVALANCHE_WARNING_HEIGHT_RATIO) {
    ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
    ctx.font = "bold 24px Geist, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("AVALANCHE!", canvasWidth / 2, screenY + 80)
    ctx.textAlign = "left"
  }
}

export function checkCollision(
  skierX: number,
  skierY: number,
  trees: Tree[],
  canvasWidth: number,
  jumpHeight: number = 0, // Jump height (0 = on ground)
  npcSkiers: NPCSkier[] = [], // NPC skiers to check collision with
): boolean {
  // Check edge collision
  if (
    skierX - SKIER_SIZE / 2 < EDGE_COLLISION_MARGIN ||
    skierX + SKIER_SIZE / 2 > canvasWidth - EDGE_COLLISION_MARGIN
  ) {
    return true
  }

  const skierLeft = skierX - SKIER_SIZE / 2
  const skierRight = skierX + SKIER_SIZE / 2
  const skierTop = skierY - SKIER_SIZE / 2
  const skierBottom = skierY + SKIER_SIZE / 2

  // Check tree collision - only with brown trunk (not triangle)
  // If jumping high enough, skip collision check (can jump over trees)
  const isHighEnough = jumpHeight >= JUMP_CLEAR_HEIGHT
  
  if (!isHighEnough) {
    for (const tree of trees) {
      // Only check collision with the trunk part
      const trunkLeft = tree.x - TREE_TRUNK_OFFSET_X
      const trunkRight = tree.x + TREE_TRUNK_OFFSET_X
      const trunkTop = tree.y + TREE_TRUNK_OFFSET_Y
      const trunkBottom = tree.y + TREE_TRUNK_OFFSET_Y + TREE_TRUNK_HEIGHT

      if (skierRight > trunkLeft && skierLeft < trunkRight && skierBottom > trunkTop && skierTop < trunkBottom) {
        return true
      }
    }
  }

  // Check NPC skier collision - can jump over NPCs if high enough
  if (!isHighEnough) {
    for (const npc of npcSkiers) {
      const npcLeft = npc.x - SKIER_SIZE / 2
      const npcRight = npc.x + SKIER_SIZE / 2
      const npcTop = npc.y - SKIER_SIZE / 2
      const npcBottom = npc.y + SKIER_SIZE / 2

      if (skierRight > npcLeft && skierLeft < npcRight && skierBottom > npcTop && skierTop < npcBottom) {
        return true
      }
    }
  }

  return false
}

