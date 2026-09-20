// ASTEROID.EXE — minimal 2D vector math.
// All helpers are immutable: they return new vectors and never mutate inputs.

export interface Vector2 {
	x: number
	y: number
}

export function vec(x: number, y: number): Vector2 {
	return { x, y }
}

export function add(a: Vector2, b: Vector2): Vector2 {
	return { x: a.x + b.x, y: a.y + b.y }
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
	return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(v: Vector2, factor: number): Vector2 {
	return { x: v.x * factor, y: v.y * factor }
}

export function dot(a: Vector2, b: Vector2): number {
	return a.x * b.x + a.y * b.y
}

export function lengthSq(v: Vector2): number {
	return dot(v, v)
}

export function length(v: Vector2): number {
	return Math.hypot(v.x, v.y)
}

export function distance(a: Vector2, b: Vector2): number {
	return Math.hypot(a.x - b.x, a.y - b.y)
}

export function normalize(v: Vector2): Vector2 {
	const magnitude = length(v)

	if (magnitude === 0) {
		return { x: 0, y: 0 }
	}

	return scale(v, 1 / magnitude)
}

// Clamp the magnitude of v to at most max. Returns a new vector.
export function limitMagnitude(v: Vector2, max: number): Vector2 {
	const magnitudeSq = lengthSq(v)

	if (magnitudeSq <= max * max) {
		return { ...v }
	}

	return scale(v, max / Math.sqrt(magnitudeSq))
}

// Unit vector pointing along the given angle in radians.
// angle 0 faces right (+x), PI/2 faces down (+y).
export function fromAngle(angle: number): Vector2 {
	return { x: Math.cos(angle), y: Math.sin(angle) }
}

export function toAngle(v: Vector2): number {
	return Math.atan2(v.y, v.x)
}