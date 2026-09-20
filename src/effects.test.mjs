import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	pruneFx,
	spawnBurst,
	spawnPopup,
	stepParticles,
	stepPopups,
} from './effects.ts'
import { MAX_PARTICLES, MAX_POPUPS } from './constants.ts'
import { mulberry32 } from './rng.ts'

test('spawnBurst fills the target with short-lived sparks', () => {
	const rng = mulberry32(1)
	const particles = []
	spawnBurst(particles, { x: 0, y: 0 }, rng, 20, '#7ff7ef')

	assert.equal(particles.length, 20)
	assert.ok(particles.every((p) => p.life > 0 && p.life <= 1))
})

test('spawnBurst obeys the particle cap', () => {
	const rng = mulberry32(1)
	const particles = Array(MAX_PARTICLES)
		.fill(null)
		.map(() => ({
			position: { x: 0, y: 0 },
			velocity: { x: 0, y: 0 },
			life: 1,
			maxLife: 1,
			color: '#fff',
			size: 1,
			drag: 1,
		}))
	spawnBurst(particles, { x: 0, y: 0 }, rng, 999, '#7ff7ef')

	assert.equal(particles.length, MAX_PARTICLES)
})

test('spawnPopup keeps the list under its cap', () => {
	const popups = []
	for (let index = 0; index < MAX_POPUPS + 5; index++) {
		spawnPopup(popups, { x: 0, y: 0 }, `+${index}`, '#fff')
	}

	assert.equal(popups.length, MAX_POPUPS)
})

test('stepParticles drifts particles upward', () => {
	const particles = []
	const rng = mulberry32(1)
	spawnBurst(particles, { x: 0, y: 0 }, rng, 3, '#fff', 100, 2, 0.5)

	stepParticles(particles, 0.1)
	const moved = particles.filter((p) => p.position.x !== 0 || p.position.y !== 0)
	assert.equal(moved.length, 3)
})

test('pruneFx removes finished effects', () => {
	const particles = []
	const popups = []
	const rng = mulberry32(1)

	spawnBurst(particles, { x: 0, y: 0 }, rng, 2, '#fff', 100, 2, 0.05)
	spawnPopup(popups, { x: 0, y: 0 }, '+1', '#fff')

	stepParticles(particles, 0.1)
	stepPopups(popups, 1.1)
	pruneFx(particles, popups)

	assert.equal(particles.length, 0)
	assert.equal(popups.length, 0)
})