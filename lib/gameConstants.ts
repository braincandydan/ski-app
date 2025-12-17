// Speed & Movement
export const BASE_SPEED = 140
export const SPEED_ACCELERATION = 80 // Speed increases when going straight
export const SPEED_DECELERATION = 40 // Base speed decrease when turning
export const MIN_SPEED = 100
export const MAX_SPEED = 700
export const ROTATION_SPEED_PENALTY = 2.5 // Multiplier for how much rotation affects speed loss (higher = more penalty)

// Tree Spawning
export const BASE_SPAWN_INTERVAL = 550
export const SPAWN_INTERVAL_MEDIUM = 480
export const SPAWN_INTERVAL_FAST = 420

// Turning & Rotation
export const BASE_TURN_ACCELERATION = 0.08
export const MAX_TURN_VELOCITY = 4
export const HORIZONTAL_SPEED_MULTIPLIER = 0.8 // Global multiplier for horizontal movement speed (higher = faster sideways)
export const TURN_DAMPING = 0.12
export const ROTATION_SPEED = 1
export const MAX_ROTATION = Math.PI / 6 // 30 degrees (initial max)
export const MAX_EXTENDED_ROTATION = Math.PI / 2 // 90 degrees (horizontal)
export const TURN_PROGRESSION_TIME = 0.5 // Time to reach initial max rotation
export const EXTENDED_TURN_TIME = 2.0 // Additional time to reach horizontal (total = 2.5s)
export const CURVE_FACTOR = 0.95 // How much rotation affects horizontal movement (higher = more curved)

// Skier
export const SKIER_SIZE = 44
export const SKIER_COLLISION_MARGIN = 14

// Trail
export const TRAIL_SPACING = 15 // pixels between trail points
export const TRAIL_MAX_AGE = 1500 // milliseconds before trail fades
export const TRAIL_LINE_WIDTH = 4

// Skier Position
export const SKIER_Y_MAX = 150 // Starting position (slow)
// SKIER_Y_MIN is calculated dynamically as CANVAS_HEIGHT * 0.75 in useSkiGame
export const SPEED_THRESHOLD_MIN = 300 // Speed at which skier starts moving down
// SPEED_THRESHOLD_MAX = MAX_SPEED (calculated dynamically)

// Avalanche
export const AVALANCHE_BASE_SPEED = 120 // Starting speed
export const AVALANCHE_ACCELERATION = 15 // Speed increase per second
export const AVALANCHE_MAX_SPEED = 500 // Maximum avalanche speed

// Canvas
export const CANVAS_MAX_WIDTH = 600
export const CANVAS_MAX_HEIGHT = 800
export const CANVAS_MARGIN = 32
export const CANVAS_ASPECT_RATIO = 3 / 4

