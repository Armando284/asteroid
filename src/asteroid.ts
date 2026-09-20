// ASTEROID.EXE — asteroid entities and the pure spawn/split logic.
// Each rock keeps a convex-ish polygon (relative vertex list) so rendering
// looks irregular while collision stays a simple circle.

import {
	FRAGMENT_SPREAD,
	LARGE_RADIUS,
	MAX_ASTEROID_FRAGMENTS,
	MAX_WAVE_COUNT,
	MEDIUM_RADIUS,
	SMALL_RADIUS,
	SPLIT_FACTOR,
	WAVE_COUNT,
	WAVE_GROWTH,
	WAVE_SPEED_STEP,
	type AsteroidSize,
} from './constants.ts'
import type { Rect } from './geometry.ts'
import type { Rng } from './rng.ts'
import { range, speed } from './rng.ts'
import type { Vector2 } from './vector.ts'
import { fromAngle, normalize, scale } from './vector.ts'

export type AsteroidId = number

export interface Asteroid {
	id: AsteroidId
	position: Vector2
	velocity: Vector2
	rotation: number
	rotationSpeed: number
	radius: number
	size: AsteroidSize
	vertices: Vector2[] // relative to the asteroid's center, radius 1
}

export const RADIUS_BY_SIZE: Record<AsteroidSize, number> = {
	large: LARGE_RADIUS,
	medium: MEDIUM_RADIUS,
	small: SMALL_RADIUS,
}

const BASE_SPEED: Record<AsteroidSize, [number, number]> = {
	large: [42, 78],
	medium: [64, 116],
	small: [88, 150],
}

// Build an irregular polygon around a unit circle: between 9 and 12 vertices
// with radius wobble, so no two rocks in a run look exactly alike.
function makeVertices(rng: Rng): Vector2[] {
	const count = 9 + Math.floor(rng() * 4)

	return Array.from({ length: count }, (_, index) => {
		const angle = (index / count) * Math.PI * 2
		const wobble = 0.68 + rng() * 0.45

		return { x: Math.cos(angle) * wobble, y: Math.sin(angle) * wobble }
	})
}

export function makeAsteroid(
	id: AsteroidId,
	position: Vector2,
	velocity: Vector2,
	size: AsteroidSize,
	rng: Rng,
): Asteroid {
	return {
		id,
		position,
		velocity,
		rotation: range(rng, 0, Math.PI * 2),
		rotationSpeed: range(rng, -1.4, 1.4),
		radius: RADIUS_BY_SIZE[size],
		size,
		vertices: makeVertices(rng),
	}
}

// Spawn an asteroid at a random in-field position, never on top of the given
// keepout point (usually the freshly placed ship).
export function spawnAsteroid(
	id: AsteroidId,
	size: AsteroidSize,
	field: Rect,
	rng: Rng,
	keepout: ReadonlyArray<Vector2>,
	minDistance: number,
): Asteroid {
	for (let attempt = 0; attempt < 40; attempt++) {
		const position = {
			x: field.left + rng() * (field.right - field.left),
			y: field.top + rng() * (field.bottom - field.top),
		}

		if (keepout.some((point) => distanceSq(position, point) < minDistance * minDistance)) {
			continue
		}

		const [min, max] = BASE_SPEED[size]
		const angle = range(rng, 0, Math.PI * 2)
		const magnitude = speed(rng, min, max)

		return makeAsteroid(
			id,
			position,
			{ x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude },
			size,
			rng,
		)
	}

	// Every attempt failed: this only happens on a tiny field, so fall back to
	// the play area center regardless of the keepout rule.
	return makeAsteroid(
		id,
		{ x: (field.left + field.right) / 2, y: (field.top + field.bottom) / 2 },
		{ x: 0, y: 0 },
		size,
		rng,
	)
}

function distanceSq(a: Vector2, b: Vector2): number {
	const dx = a.x - b.x
	const dy = a.y - b.y

	return dx * dx + dy * dy
}

const SMALLER: Record<AsteroidSize, AsteroidSize> = {
	large: 'medium',
	medium: 'small',
	small: 'small',
}

// A destroyed asteroid becomes two of the next-smallest size; small rocks
// break apart into nothing. Children inherit the parent's travel direction
// (SPLIT_FACTOR of its speed) plus a perpendicular random kick.
export function splitAsteroid(
	asteroid: Asteroid,
	nextId: number,
	rng: Rng,
	count: number,
): Asteroid[] {
	if (asteroid.size === 'small' || count >= MAX_ASTEROID_FRAGMENTS) {
		return []
	}

	const childSize = SMALLER[asteroid.size]
	const direction =
		Math.hypot(asteroid.velocity.x, asteroid.velocity.y) > 0
			? normalize(asteroid.velocity)
			: fromAngle(range(rng, 0, Math.PI * 2))
	const parentSpeed = Math.hypot(asteroid.velocity.x, asteroid.velocity.y)
	const inherited = scale(direction, parentSpeed * SPLIT_FACTOR * 0.5)
	const children: Asteroid[] = []

	for (let side = -1; side <= 1; side += 2) {
		const kick = range(rng, 0.4, 1) * FRAGMENT_SPREAD * parentSpeed
		const perpendicular = { x: -direction.y * side * kick, y: direction.x * side * kick }

		const velocity = {
			x: inherited.x + perpendicular.x,
			y: inherited.y + perpendicular.y,
		}

		children.push(
			makeAsteroid(nextId + side, asteroid.position, velocity, childSize, rng),
		)
	}

	return children
}

// Number of fresh large rocks for a wave; difficulty ramps until the cap.
export function waveCount(wave: number): number {
	return Math.min(WAVE_COUNT + (wave - 1) * WAVE_GROWTH, MAX_WAVE_COUNT)
}

// Speed multiplier that grows gently with each wave.
export function waveSpeedFactor(wave: number): number {
	return 1 + (wave - 1) * WAVE_SPEED_STEP
}