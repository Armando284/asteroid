// ASTEROID.EXE — ship kinematics as a thin, pure physics module.
// Rotation and thrust are frame-rate independent: every term multiplies dt,
// so the same keypresses produce the same motion at 60, 120 or 144 Hz.

import {
	DRAG,
	MAX_SPEED,
	ROTATION_SPEED,
	SHIP_RADIUS,
	THRUST,
} from './constants.ts'
import type { Rect } from './geometry.ts'
import { wrap } from './geometry.ts'
import type { Vector2 } from './vector.ts'
import { fromAngle, limitMagnitude, scale } from './vector.ts'

export interface Ship {
	position: Vector2
	velocity: Vector2
	rotation: number // radians
	radius: number
}

export interface ShipInput {
	turn: -1 | 0 | 1
	thrust: boolean
}

export function makeShip(field: Rect): Ship {
	return {
		position: {
			x: (field.left + field.right) / 2,
			y: (field.top + field.bottom) / 2,
		},
		velocity: { x: 0, y: 0 },
		rotation: -Math.PI / 2, // faces up by default
		radius: SHIP_RADIUS,
	}
}

// Advance the ship by dt seconds against the given input.
export function updateShip(ship: Ship, input: ShipInput, dt: number): void {
	ship.rotation += input.turn * ROTATION_SPEED * dt

	if (input.thrust) {
		const direction = fromAngle(ship.rotation)
		const acceleration = scale(direction, THRUST * dt)
		ship.velocity.x += acceleration.x
		ship.velocity.y += acceleration.y
	}

	// Exponential damping: velocity decays smoothly toward zero while coasting.
	const damping = Math.exp(-DRAG * dt)
	ship.velocity.x *= damping
	ship.velocity.y *= damping

	ship.velocity = limitMagnitude(ship.velocity, MAX_SPEED)

	ship.position.x += ship.velocity.x * dt
	ship.position.y += ship.velocity.y * dt
}

export function wrapShip(ship: Ship, field: Rect): void {
	ship.position.x = wrap(ship.position.x, field.left, field.right)
	ship.position.y = wrap(ship.position.y, field.top, field.bottom)
}