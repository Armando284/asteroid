import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	makeAsteroid,
	splitAsteroid,
	spawnAsteroid,
	waveCount,
} from './asteroid.ts'
import { LARGE_RADIUS, MEDIUM_RADIUS, SMALL_RADIUS } from './constants.ts'
import { mulberry32 } from './rng.ts'

const FIELD = { left: 0, top: 44, right: 900, bottom: 600 }

test('makeAsteroid carries the right radius and polygon size', () => {
	const rng = mulberry32(1)
	const large = makeAsteroid(1, { x: 10, y: 10 }, { x: 0, y: 0 }, 'large', rng)
	const small = makeAsteroid(2, { x: 10, y: 10 }, { x: 0, y: 0 }, 'small', rng)

	assert.equal(large.radius, LARGE_RADIUS)
	assert.equal(small.radius, SMALL_RADIUS)
	assert.ok(large.vertices.length >= 9 && large.vertices.length <= 12)
})

test('spawnAsteroid respects the keepout zone', () => {
	const rng = mulberry32(5)
	const ship = { x: 450, y: 300 }
	const rock = spawnAsteroid(1, 'large', FIELD, rng, [ship], 130)

	const dx = rock.position.x - ship.x
	const dy = rock.position.y - ship.y
	assert.ok(dx * dx + dy * dy >= 130 * 130)
})

test('splitAsteroid breaks large into two medium rocks', () => {
	const rng = mulberry32(3)
	const large = makeAsteroid(1, { x: 100, y: 100 }, { x: 40, y: 10 }, 'large', rng)

	const children = splitAsteroid(large, 10, rng, 2)

	assert.equal(children.length, 2)
	for (const child of children) {
		assert.equal(child.size, 'medium')
		assert.equal(child.radius, MEDIUM_RADIUS)
	}
})

test('splitAsteroid breaks medium into small and small into nothing', () => {
	const rng = mulberry32(3)
	const medium = makeAsteroid(1, { x: 100, y: 100 }, { x: 40, y: 10 }, 'medium', rng)
	assert.equal(splitAsteroid(medium, 10, rng, 2).length, 2)

	const small = makeAsteroid(1, { x: 100, y: 100 }, { x: 40, y: 10 }, 'small', rng)
	assert.equal(splitAsteroid(small, 10, rng, 2).length, 0)
})

test('splitAsteroid honours the fragment cap', () => {
	const rng = mulberry32(3)
	const rock = makeAsteroid(1, { x: 100, y: 100 }, { x: 40, y: 10 }, 'large', rng)

	assert.equal(splitAsteroid(rock, 10, rng, 40).length, 0)
})

test('waveCount ramps from the base cap and stops', () => {
	assert.equal(waveCount(1), 4)
	assert.equal(waveCount(2), 5)
	assert.equal(waveCount(3), 6)
	assert.equal(waveCount(10), 8)
})

test('spawn fallback centers a rock when the field is hostile', () => {
	const rng = mulberry32(1)
	const tiny = { left: 0, top: 0, right: 200, bottom: 200 }
	const rock = spawnAsteroid(1, 'large', tiny, rng, [{ x: 100, y: 100 }], 1000)

	assert.equal(rock.position.x, 100)
	assert.equal(rock.position.y, 100)
})