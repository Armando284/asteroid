import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mulberry32, range, speed } from './rng.ts'

test('mulberry32 is deterministic for a given seed', () => {
	const seq = (seed) => {
		const rng = mulberry32(seed)
		return Array.from({ length: 8 }, () => Math.round(rng() * 100) / 100)
	}

	assert.deepEqual(seq(20260920), seq(20260920))
	assert.notDeepEqual(seq(1), seq(2))
})

test('mulberry32 outputs stay in [0, 1)', () => {
	const rng = mulberry32(99)

	for (let index = 0; index < 500; index++) {
		const value = rng()
		assert.ok(value >= 0 && value < 1)
	}
})

test('range samples inside [min, max)', () => {
	const rng = mulberry32(42)

	for (let index = 0; index < 200; index++) {
		const value = range(rng, 5, 20)
		assert.ok(value >= 5 && value < 20)
	}
})

test('range of size zero yields the edge', () => {
	assert.equal(range(mulberry32(1), 4, 4), 4)
})

test('speed stays in the requested band', () => {
	const rng = mulberry32(7)

	for (let index = 0; index < 200; index++) {
		const value = speed(rng, 10, 50)
		assert.ok(value >= 10 && value <= 50 * 1.35)
	}
})