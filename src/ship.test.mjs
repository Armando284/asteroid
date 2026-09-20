import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeShip, updateShip, wrapShip } from './ship.ts'
import { MAX_SPEED, SHIP_RADIUS } from './constants.ts'

const FIELD = { left: 0, top: 44, right: 900, bottom: 600 }

test('makeShip places the ship centered and facing up', () => {
	const ship = makeShip(FIELD)

	assert.equal(ship.position.x, 450)
	assert.equal(ship.position.y, 322)
	assert.equal(ship.velocity.x, 0)
	assert.equal(ship.velocity.y, 0)
	assert.equal(ship.rotation, -Math.PI / 2)
	assert.equal(ship.radius, SHIP_RADIUS)
})

test('updateShip turns at ROTATION_SPEED', () => {
	const ship = makeShip(FIELD)
	updateShip(ship, { turn: 1, thrust: false }, 0.5)

	assert.ok(ship.rotation > -Math.PI / 2)
	assert.ok(ship.rotation < 0)

	updateShip(ship, { turn: -1, thrust: false }, 0.5)
	assert.ok(Math.abs(ship.rotation + Math.PI / 2) < 1e-6)
})

test('updateShip thrust accelerates toward the nose', () => {
	const ship = makeShip(FIELD)
	updateShip(ship, { turn: 0, thrust: true }, 1)

	assert.ok(ship.velocity.y < 0)
	assert.ok(Math.abs(ship.velocity.x) < 1e-9)
})

test('updateShip clamps velocity to MAX_SPEED', () => {
	const ship = makeShip(FIELD)
	ship.velocity = { x: 1000, y: 0 }
	updateShip(ship, { turn: 0, thrust: false }, 0)

	assert.ok(Math.hypot(ship.velocity.x, ship.velocity.y) <= MAX_SPEED)
})

test('updateShip dampens velocity while coasting', () => {
	const ship = makeShip(FIELD)
	ship.velocity = { x: 100, y: 0 }
	updateShip(ship, { turn: 0, thrust: false }, 1)

	const magnitude = Math.hypot(ship.velocity.x, ship.velocity.y)
	assert.ok(magnitude > 0)
	assert.ok(magnitude < 100)
})

test('wrapShip wraps coordinates across both edges', () => {
	const ship = makeShip(FIELD)
	ship.position.x = 901
	ship.position.y = 601
	wrapShip(ship, FIELD)

	assert.equal(ship.position.x, 1)
	assert.equal(ship.position.y, 45)

	ship.position.x = -5
	ship.position.y = 40
	wrapShip(ship, FIELD)

	assert.equal(ship.position.x, 895)
	assert.equal(ship.position.y, 596)
})