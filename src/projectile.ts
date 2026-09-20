// ASTEROID.EXE — projectiles. Shots inherit a share of the ship's drift so
// firing while moving feels natural, then die after a short lifetime.

import { BULLET_DRIFT, BULLET_LIFE, BULLET_RADIUS, BULLET_SPEED } from './constants.ts'
import type { Rect } from './geometry.ts'
import { wrap } from './geometry.ts'
import type { Vector2 } from './vector.ts'
import { fromAngle, scale } from './vector.ts'

export interface Projectile {
	position: Vector2
	velocity: Vector2
	life: number
	radius: number
}

export function makeProjectile(
	nose: Vector2,
	shipVelocity: Vector2,
	rotation: number,
): Projectile {
	const direction = fromAngle(rotation)
	const fired = scale(direction, BULLET_SPEED)
	const drift = scale(shipVelocity, BULLET_DRIFT)

	return {
		position: { ...nose },
		velocity: { x: fired.x + drift.x, y: fired.y + drift.y },
		life: BULLET_LIFE,
		radius: BULLET_RADIUS,
	}
}

// Move the shot by dt seconds and wrap it around the field. Returning false
// means the projectile exhausted its lifetime and should be removed.
export function stepProjectile(projectile: Projectile, dt: number, field: Rect): boolean {
	projectile.life -= dt
	projectile.position.x += projectile.velocity.x * dt
	projectile.position.y += projectile.velocity.y * dt
	projectile.position.x = wrap(projectile.position.x, field.left, field.right)
	projectile.position.y = wrap(projectile.position.y, field.top, field.bottom)

	return projectile.life > 0
}