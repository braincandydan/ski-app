export interface Tree {
  x: number
  y: number
  id: number
}

export interface Jump {
  x: number
  y: number
  id: number
  treeId?: number // Optional: ID of tree this jump allows jumping over
}

export interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

export interface NPCSkier {
  x: number
  y: number
  id: number
  rotation: number
  targetRotation: number
  velocityX: number
  speed: number
  turnDirection: "left" | "right" // Current turning direction
  turnTimer: number // Time until next turn direction change
  type: "beginner" // Future: could add "intermediate", "expert", etc.
}

export type Direction = "down" | "left" | "right"

export type GameState = "menu" | "playing" | "gameover"

export interface GameStateRef {
  skierX: number
  skierY: number
  trees: Tree[]
  jumps: Jump[] // Jump ramps that allow jumping over trees
  npcSkiers: NPCSkier[] // NPC skiers on the slope
  speed: number
  score: number
  level: number // Current level (starts at 1)
  holding: boolean
  nextDirection: "left" | "right"
  currentDirection: Direction
  rotation: number
  holdStartTime: number
  targetRotation: number
  velocityX: number
  jumpHeight: number // Current jump height (0 = on ground)
  jumpVelocity: number // Vertical velocity for jump
  isJumping: boolean // Whether skier is currently jumping
  treeIdCounter: number
  jumpIdCounter: number
  npcSkierIdCounter: number
  lastTreeSpawn: number
  lastNPCSkierSpawn: number
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

