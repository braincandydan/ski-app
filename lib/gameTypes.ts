export interface Tree {
  x: number
  y: number
  id: number
}

export interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

export type Direction = "down" | "left" | "right"

export type GameState = "menu" | "playing" | "gameover"

export interface GameStateRef {
  skierX: number
  skierY: number
  trees: Tree[]
  speed: number
  score: number
  holding: boolean
  nextDirection: "left" | "right"
  currentDirection: Direction
  rotation: number
  holdStartTime: number
  targetRotation: number
  velocityX: number
  treeIdCounter: number
  lastTreeSpawn: number
  animationFrameId: number
  lastFrameTime: number
  trail: TrailPoint[]
  lastTrailPoint: number
  cameraShakeX: number
  cameraShakeY: number
  avalancheY: number
  avalancheSpeed: number
  gameStartTime: number
  backgroundOffset: number // Tracks background line position based on speed
}

