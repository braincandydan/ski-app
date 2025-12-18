// Speed & Movement
export const BASE_SPEED = 200
export const SPEED_ACCELERATION = 180 // Speed increases when going straight
export const SPEED_DECELERATION = 40 // Base speed decrease when turning
export const MIN_SPEED = 150
export const MAX_SPEED = 700
export const ROTATION_SPEED_PENALTY = 0.5 // Multiplier for how much rotation affects speed loss (higher = more penalty)

// Tree Spawning
export const BASE_SPAWN_INTERVAL = 950
export const SPAWN_INTERVAL_MEDIUM = 880
export const SPAWN_INTERVAL_FAST = 1120

// Turning & Rotation
export const BASE_TURN_ACCELERATION = 0.6
export const MAX_TURN_VELOCITY = 4
export const HORIZONTAL_SPEED_MULTIPLIER = 0.8 // Global multiplier for horizontal movement speed (higher = faster sideways)
export const TURN_DAMPING = 0.9
export const ROTATION_SPEED = 0.9
export const MAX_ROTATION = Math.PI / 6 // 30 degrees (initial max)
export const MAX_EXTENDED_ROTATION = Math.PI / 2 // 90 degrees (horizontal)
export const TURN_PROGRESSION_TIME = 0.1 // Time to reach initial max rotation
export const EXTENDED_TURN_TIME = 1.0 // Additional time to reach horizontal (total = 2.5s)
export const CURVE_FACTOR = 1 // How much rotation affects horizontal movement (higher = more curved)

// Skier
export const SKIER_SIZE = 44
export const SKIER_COLLISION_MARGIN = 4

// Tree Dimensions (for collision and rendering)
export const TREE_TRUNK_WIDTH = 16 // Width of tree trunk
export const TREE_TRUNK_HEIGHT = 20 // Height of tree trunk
export const TREE_TRUNK_OFFSET_X = 8 // Half width (trunk centered on tree x)
export const TREE_TRUNK_OFFSET_Y = 20 // Y offset from tree center for trunk top

// Jump System
export const JUMP_WIDTH = 60 // Width of jump ramp
export const JUMP_HEIGHT = 12 // Height of jump ramp
export const JUMP_DISTANCE_FROM_TREE = 80 // Distance jump spawns before tree
export const JUMP_SPAWN_CHANCE = 0.3 // Probability (0-1) that a jump spawns before a tree (30% chance)
export const JUMP_LAUNCH_VELOCITY = 400 // Initial upward velocity when hitting jump
export const JUMP_GRAVITY = 900 // Gravity affecting jump (pixels per second squared)
export const JUMP_CLEAR_HEIGHT = 20 // Minimum jump height needed to clear a tree
export const JUMP_COLLISION_WIDTH = 50 // Width for collision detection with jump ramp
export const JUMP_MAX_SCALE = 1.4 // Maximum scale multiplier when at peak jump height (40% larger)

// Trail
export const TRAIL_SPACING = 15 // pixels between trail points
export const TRAIL_MAX_AGE = 900 // milliseconds before trail fades
export const TRAIL_LINE_WIDTH = 4
export const TRAIL_OPACITY = 0.4 // Base opacity of trail (0-1)

// Skier Position
export const SKIER_Y_MAX = 150 // Starting position (slow)
// SKIER_Y_MIN is calculated dynamically as CANVAS_HEIGHT * 0.75 in useSkiGame
export const SPEED_THRESHOLD_MIN = 300 // Speed at which skier starts moving down
// SPEED_THRESHOLD_MAX = MAX_SPEED (calculated dynamically)

// Avalanche
export const AVALANCHE_BASE_SPEED = 120 // Starting speed
export const AVALANCHE_ACCELERATION = 15 // Speed increase per second
export const AVALANCHE_MAX_SPEED = 500 // Maximum avalanche speed

// Initial State
export const INITIAL_SKIER_X = 300 // Starting X position (will be overridden to canvasWidth / 2)
export const INITIAL_SKIER_Y = 150 // Starting Y position
export const INITIAL_SPEED = 140 // Starting speed (lower than BASE_SPEED for gradual start)
export const INITIAL_AVALANCHE_Y = -200 // Starting Y position of avalanche (offscreen above)

// Physics Multipliers & Adjustments
export const TURN_ACCELERATION_SPEED_FACTOR = 1.5 // Multiplier for how speed affects turn acceleration
export const MAX_VELOCITY_BASE_MULTIPLIER = 0.4 // Base multiplier for max turn velocity
export const MAX_VELOCITY_SPEED_MULTIPLIER = 1.2 // Speed-based multiplier for max turn velocity
export const ROTATION_MULTIPLIER_SCALE = 2 // How much extended turns increase rotation multiplier
export const SPEED_RECOVERY_ROTATION_PENALTY = 0.5 // Reduces speed recovery when rotated (0-1, higher = more penalty)
export const SKIER_Y_INTERPOLATION_RATE = 0.05 // How fast skier Y position adjusts (0-1, higher = faster)
export const SKIER_Y_MIN_PERCENTAGE = 0.75 // Percentage of canvas height for minimum Y (25% from bottom)
export const VELOCITY_STOP_THRESHOLD = 0.01 // Minimum velocity before stopping horizontal movement

// Camera & Effects
export const CAMERA_SHAKE_SPEED_THRESHOLD = 300 // Speed at which camera shake starts
export const CAMERA_SHAKE_INTENSITY = 3 // Maximum camera shake intensity multiplier
export const CAMERA_SHAKE_MAX_SPEED_OFFSET = 300 // Speed offset for camera shake calculation

// Tree Spawning & Management
export const TREE_SPAWN_SPEED_FAST = 260 // Speed threshold for fast spawn interval
export const TREE_SPAWN_SPEED_MEDIUM = 200 // Speed threshold for medium spawn interval
export const TREE_SPAWN_X_MARGIN = 100 // Margin from canvas edges for tree X position
export const TREE_SPAWN_X_OFFSET = 50 // Minimum X offset from left edge
export const TREE_SPAWN_Y_OFFSET = 50 // Y offset below canvas for spawning
export const TREE_CLEANUP_Y_THRESHOLD = -100 // Y position threshold for removing trees

// Collision & Interaction
export const AVALANCHE_CATCH_THRESHOLD = -30 // Y distance threshold for avalanche catch (skierY - avalancheY)
export const EDGE_COLLISION_MARGIN = 14 // Collision margin from canvas edges (matches SKIER_COLLISION_MARGIN)

// Scoring
export const SCORE_SPEED_DIVISOR = 100 // Speed divided by this to calculate score per second
export const HINT_DISPLAY_SCORE_THRESHOLD = 50 // Score below which to show control hint

// Level System
export const SCORE_PER_LEVEL = 10 // Score (meters) required to advance one level
export const LEVEL_SPAWN_INTERVAL_REDUCTION = 1 // Base interval reduction per level (0.95 = intervals get 5% shorter each level)
export const LEVEL_MIN_SPAWN_INTERVAL = 10 // Minimum spawn interval (prevents it from getting too fast)
export const LEVEL_TREE_DENSITY_MULTIPLIER = 1.5 // Tree density multiplier per level (1.0 = no change, 1.05 = 5% more trees, 0.95 = 5% fewer trees). Applied on top of interval reduction.
export const LEVEL_MAX_TREES_ON_SCREEN = 0 // Maximum trees on screen at once (0 = unlimited, >0 = hard limit)
export const LEVEL_SPEED_BONUS = 5 // Additional base speed per level (additive)
export const LEVEL_AVALANCHE_ACCELERATION_BONUS = 1 // Additional avalanche acceleration per level (additive)
export const LEVEL_TREE_SPAWN_THRESHOLD_REDUCTION = 10 // Reduce tree spawn speed thresholds per level (makes fast spawn happen sooner)

// Avalanche Visual
export const AVALANCHE_DRAW_THRESHOLD = -50 // Y position above which avalanche is not drawn
export const AVALANCHE_HEIGHT = 150 // Height of avalanche visual effect
export const AVALANCHE_GRADIENT_TOP_OFFSET = -100 // Top offset for gradient
export const AVALANCHE_GRADIENT_BOTTOM_OFFSET = 50 // Bottom offset for gradient
export const AVALANCHE_WARNING_Y_THRESHOLD = -50 // Y position above which warning appears
export const AVALANCHE_WARNING_HEIGHT_RATIO = 1 / 3 // Portion of canvas height for warning trigger

// NPC Skier System
export const NPC_BEGINNER_SPEED = 100 // Base speed for beginner NPC skiers (slower than player)
export const NPC_BEGINNER_TURN_ACCELERATION = 150.0 // How fast beginner NPCs turn (much stronger to reach high target velocities quickly)
export const NPC_BEGINNER_MAX_ROTATION = Math.PI / 6 // Maximum rotation for beginners (30 degrees, same as player)
export const NPC_BEGINNER_TURN_INTERVAL_MIN = 0.6 // Minimum time between turn direction changes (seconds)
export const NPC_BEGINNER_TURN_INTERVAL_MAX = 1.2 // Maximum time between turn direction changes (seconds)
export const NPC_BEGINNER_ROTATION_SPEED = 0.9 // How fast NPC rotation interpolates
export const NPC_BEGINNER_TURN_DAMPING = 0.97 // Damping for NPC horizontal velocity (reduced to allow faster velocity buildup)
export const NPC_BEGINNER_MAX_VELOCITY = 80.0 // Maximum horizontal velocity (much higher for visible movement across hill)
export const NPC_BEGINNER_SPAWN_INTERVAL = 3000 // Milliseconds between NPC skier spawns
export const NPC_BEGINNER_TREE_AVOIDANCE_DISTANCE = 80 // Distance at which NPC starts avoiding trees
export const NPC_BEGINNER_TREE_AVOIDANCE_FORCE = 2.0 // Force multiplier for tree avoidance steering
export const NPC_BEGINNER_EDGE_AVOIDANCE_DISTANCE = 60 // Distance from edge to start avoiding
export const NPC_BEGINNER_EDGE_AVOIDANCE_FORCE = 1.5 // Force multiplier for edge avoidance

// Canvas
export const CANVAS_MAX_WIDTH = 600
export const CANVAS_MAX_HEIGHT = 800
export const CANVAS_MARGIN = 32
export const CANVAS_ASPECT_RATIO = 3 / 4

