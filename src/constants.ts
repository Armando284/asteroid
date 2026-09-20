// ASTEROID.EXE — shared tuning values and the phosphor-cyan vector palette.
// Everything moves in continuous canvas pixels; velocities are px/second.

export const CANVAS_WIDTH = 900
export const CANVAS_HEIGHT = 600

// The top band is reserved for the HUD; entities wrap inside the play field.
export const HUD_HEIGHT = 44
export const PLAY_LEFT = 0
export const PLAY_TOP = HUD_HEIGHT
export const PLAY_RIGHT = CANVAS_WIDTH
export const PLAY_BOTTOM = CANVAS_HEIGHT

export const CELL = 16 // base monospace cell used by the renderer

// --- ship --------------------------------------------------------------

export const ROTATION_SPEED = 2.8 // radians/second
export const THRUST = 290 // px/s^2 while the thrust key is held
export const MAX_SPEED = 250 // px/s, velocity is clamped to this
export const DRAG = 0.35 // per-second exponential damping while coasting
export const SHIP_RADIUS = 10 // collision radius
export const SHIP_LENGTH = 15 // rendered nose-to-tail

// --- projectiles -------------------------------------------------------

export const FIRE_COOLDOWN = 0.17 // seconds between shots
export const BULLET_SPEED = 470 // px/s, added on top of inherited drift
export const BULLET_DRIFT = 0.55 // share of ship velocity inherited
export const BULLET_LIFE = 1.05 // seconds before the shot fades
export const BULLET_RADIUS = 3
export const MAX_BULLETS = 6

// --- asteroids ---------------------------------------------------------

export type AsteroidSize = 'large' | 'medium' | 'small'

export const LARGE_RADIUS = 46
export const MEDIUM_RADIUS = 26
export const SMALL_RADIUS = 15

export const SPLIT_FACTOR = 0.9 // children inherit this share of parent speed
export const FRAGMENT_SPREAD = 0.85 // random perpendicular kick on split
export const MAX_ASTEROID_FRAGMENTS = 40
export const WAVE_COUNT = 4 // large asteroids on wave 1
export const WAVE_GROWTH = 1 // extra large asteroid per wave
export const MAX_WAVE_COUNT = 8
export const WAVE_SPEED_STEP = 0.07 // asteroid speed multiplier per wave

export const ASTEROID_POINTS: Record<AsteroidSize, number> = {
	large: 20,
	medium: 50,
	small: 100,
}

// --- survival / pacing -------------------------------------------------

export const MAX_LIVES = 3
export const INVINCIBLE_DURATION = 2 // seconds of grace after respawn
export const DEATH_DURATION = 1.1 // seconds of the death animation
export const WAVE_BANNER_DURATION = 1.4 // seconds of the "WAVE N" banner
export const WAVE_BONUS = 100 // flat bonus for clearing a wave

export const MAX_PARTICLES = 90
export const MAX_POPUPS = 12

// --- persistence -------------------------------------------------------

export const HI_SCORE_KEY = 'asteroid-hi-score'

// --- palette -----------------------------------------------------------

export const PALETTE = {
	bg: '#020707',
	grid: '#0b2023',
	dim: '#1f5a57',
	dimLine: '#2b6f6c',
	line: '#7ff7ef',
	bright: '#eafcfc',
	white: '#ffffff',
	hud: '#4fd8d0',
	gold: '#ffd166',
	red: '#ff5c5c',
} as const