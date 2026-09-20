import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeProjectile, stepProjectile } from './projectile.ts'
import { BULLET_LIFE, BULLET_DRIFT, BULLET_SPEED } from './constants.ts'

const FIELD = { left: 0, top: 44, right: 900, bottom: 600 }

test('makeProjectile fires along the nose with inherited drift', () => {
	const shot = makeProjectile({ x: 10, y: 10 }, { x: 100, y: 0 }, 0)

	assert.equal(shot.position.x, 10)
	assert.equal(shot.position.y, 10)
	assert.equal(shot.life, BULLET_LIFE)
	assert.equal(shot.velocity.x, BULLET_SPEED + 100 * BULLET_DRIFT)
	assert.equal(shot.velocity.y, 0)
})

test('stepProjectile moves and wraps around the field', () => {
	const shot = makeProjectile({ x: 899, y: 46 }, { x: 100, y: 0 }, 0)

	shot.velocity = { x: 100, y: 0 }
	stepProjectile(shot, 0.5, FIELD)

	assert.equal(shot.position.x, 49)
})

test('stepProjectile expires after the lifetime', () => {
	const shot = makeProjectile({ x: 10, y: 10 }, { x: 0, y: 0 }, 0)

	assert.equal(stepProjectile(shot, 1, FIELD), true)
	assert.equal(stepProjectile(shot, 0.1, FIELD), false)
})