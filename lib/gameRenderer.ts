import type { TrailPoint, Tree } from "./gameTypes"
import {
  SKIER_SIZE,
  MAX_ROTATION,
  TRAIL_MAX_AGE,
  TRAIL_LINE_WIDTH,
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
      ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * 0.4})`
      ctx.lineWidth = TRAIL_LINE_WIDTH
      ctx.beginPath()
      ctx.moveTo(point.x + cameraShakeX, point.y + cameraShakeY)
      ctx.lineTo(nextPoint.x + cameraShakeX, nextPoint.y + cameraShakeY)
      ctx.stroke()
    }
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

    // Draw sprite centered at position
    const drawWidth = SKIER_SIZE
    const drawHeight = (frameHeight / frameWidth) * SKIER_SIZE

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
  }
}

export function drawTreeTrunk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cameraShakeX: number,
  cameraShakeY: number,
) {
  const shakeX = x + cameraShakeX
  const shakeY = y + cameraShakeY

  // Brown trunk
  ctx.fillStyle = "#92400e"
  ctx.fillRect(shakeX - 8, shakeY + 20, 16, 20)
}

export function drawTreeTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cameraShakeX: number,
  cameraShakeY: number,
) {
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
  if (avalancheY < -50) return // Don't draw if too far above screen

  const screenY = avalancheY + cameraShakeY

  // Create gradient for avalanche effect (white to gray)
  const gradient = ctx.createLinearGradient(0, screenY - 100, 0, screenY + 50)
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)")
  gradient.addColorStop(0.4, "rgba(226, 232, 240, 0.7)")
  gradient.addColorStop(0.7, "rgba(203, 213, 225, 0.9)")
  gradient.addColorStop(1, "rgba(148, 163, 184, 1)")

  ctx.fillStyle = gradient
  ctx.fillRect(0, screenY - 100, canvasWidth, 150)

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
  if (screenY > -50 && screenY < canvasHeight / 3) {
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
): boolean {
  // Check edge collision
  if (
    skierX - SKIER_SIZE / 2 < 14 ||
    skierX + SKIER_SIZE / 2 > canvasWidth - 14
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
}

