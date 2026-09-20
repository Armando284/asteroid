import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	add,
	subtract,
	scale,
	dot,
	length,
	distance,
	normalize,
	limitMagnitude,
	fromAngle,
	toAngle,
} from './vector.ts'

test('add and subtract combine components', () => {
	assert.deepEqual(add({ x: 1, y: 2 }, { x: 3, y: -4 }), { x: 4, y: -2 })
	assert.deepEqual(subtract({ x: 1, y: 2 }, { x: 3, y: -4 }), { x: -2, y: 6 })
})

test('scale multiplies by a factor', () => {
	assert.deepEqual(scale({ x: 2, y: -3 }, 4), { x: 8, y: -12 })

	const zero = scale({ x: 2, y: -3 }, 0)
	assert.ok(zero.x === 0 && zero.y === 0)
})

test('dot and length follow the euclidean rules', () => {
	assert.equal(dot({ x: 1, y: 2 }, { x: 3, y: 4 }), 11)
	assert.equal(length({ x: 3, y: 4 }), 5)
	assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5)
})

test('normalize produces a unit vector and handles zero', () => {
	const unit = normalize({ x: 3, y: 4 })
	assert.ok(Math.abs(unit.x - 0.6) < 1e-9)
	assert.ok(Math.abs(unit.y - 0.8) < 1e-9)

	const zero = normalize({ x: 0, y: 0 })
	assert.ok(zero.x === 0 && zero.y === 0)
})

test('limitMagnitude clamps length without damping short vectors', () => {
	assert.deepEqual(limitMagnitude({ x: 1, y: 0 }, 10), { x: 1, y: 0 })
	assert.deepEqual(limitMagnitude({ x: 100, y: 0 }, 10), { x: 10, y: 0 })

	const diag = limitMagnitude({ x: 3, y: 4 }, 2.5)
	assert.ok(Math.abs(length(diag) - 2.5) < 1e-9)
})

test('fromAngle/toAngle round-trip', () => {
	for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
		const v = fromAngle(angle)
		assert.ok(Math.abs(toAngle(v) - angle) < 1e-9)
	}
})

test('fromAngle points the canonical directions', () => {
	assert.ok(Math.abs(fromAngle(0).x - 1) < 1e-9)
	assert.ok(Math.abs(fromAngle(0).y) < 1e-9)
	assert.ok(Math.abs(fromAngle(Math.PI / 2).x) < 1e-9)
	assert.ok(Math.abs(fromAngle(Math.PI / 2).y - 1) < 1e-9)
})