import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clamp, circlesOverlap, lerp, pad, wrap } from './geometry.ts'

test('wrap keeps values inside the half-open interval', () => {
	assert.equal(wrap(5, 0, 10), 5)
	assert.equal(wrap(-1, 0, 10), 9)
	assert.equal(wrap(10, 0, 10), 0)
	assert.equal(wrap(11, 0, 10), 1)
	assert.equal(wrap(-10, 0, 10), 0)
	assert.equal(wrap(0, 0, 10), 0)
})

test('wrap collapses a degenerate span', () => {
	assert.equal(wrap(25, 0, 0), 0)
})

test('circlesOverlap detects touching and overlapping circles', () => {
	const a = { x: 0, y: 0 }

	assert.equal(circlesOverlap(a, 3, { x: 0, y: 2 }, 1), true)
	assert.equal(circlesOverlap(a, 3, { x: 0, y: 4 }, 1), true)
	assert.equal(circlesOverlap(a, 3, { x: 0, y: 5 }, 1), false)
	assert.equal(circlesOverlap(a, 3, { x: 0, y: 4.001 }, 1), false)
	assert.equal(circlesOverlap(a, 3, { x: 10, y: 0 }, 1), false)
})

test('clamp bounds a value', () => {
	assert.equal(clamp(5, 0, 10), 5)
	assert.equal(clamp(-1, 0, 10), 0)
	assert.equal(clamp(11, 0, 10), 10)
	assert.equal(clamp(0, 0, 10), 0)
	assert.equal(clamp(10, 0, 10), 10)
})

test('lerp interpolates between values', () => {
	assert.equal(lerp(0, 10, 0), 0)
	assert.equal(lerp(0, 10, 0.5), 5)
	assert.equal(lerp(0, 10, 1), 10)
	assert.equal(lerp(10, 0, 0.25), 7.5)
})

test('pad left-pads with zeros', () => {
	assert.equal(pad(7, 4), '0007')
	assert.equal(pad(123, 4), '0123')
	assert.equal(pad(12345, 4), '12345')
	assert.equal(pad(0, 2), '00')
})