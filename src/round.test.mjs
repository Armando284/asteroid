import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	addScore,
	clearWave,
	freshRound,
	loseLife,
	startRun,
	toPaused,
	toPlaying,
	toTitle,
	waveBonus,
} from './round.ts'
import { MAX_LIVES } from './constants.ts'

test('freshRound starts on the title with a full complement', () => {
	const round = freshRound(500)

	assert.equal(round.status, 'title')
	assert.equal(round.score, 0)
	assert.equal(round.hiScore, 500)
	assert.equal(round.wave, 1)
	assert.equal(round.lives, MAX_LIVES)
	assert.equal(round.newHi, false)
})

test('startRun resets a fresh playable run', () => {
	const round = startRun(freshRound(500))

	assert.equal(round.status, 'playing')
	assert.equal(round.score, 0)
	assert.equal(round.lives, MAX_LIVES)
	assert.equal(round.wave, 1)
})

test('addScore accumulates and tracks a new high score', () => {
	let round = freshRound(100)
	round = addScore(round, 50)
	assert.equal(round.score, 50)
	assert.equal(round.hiScore, 100)
	assert.equal(round.newHi, false)

	round = addScore(round, 60)
	assert.equal(round.score, 110)
	assert.equal(round.hiScore, 110)
	assert.equal(round.newHi, true)
})

test('clearWave adds the bonus and advances the wave', () => {
	const round = clearWave(startRun(freshRound(0)))

	assert.equal(round.wave, 2)
	assert.equal(round.score, waveBonus())
})

test('loseLife decrements lives and ends the run at zero', () => {
	let round = startRun(freshRound(0))

	for (let index = 0; index < MAX_LIVES - 1; index++) {
		round = loseLife(round)
		assert.equal(round.status, 'playing')
	}

	assert.equal(round.lives, 1)
	round = loseLife(round)
	assert.equal(round.lives, 0)
	assert.equal(round.status, 'gameover')
})

test('status views switch cleanly', () => {
	const round = startRun(freshRound(0))

	assert.equal(toPaused(round).status, 'paused')
	assert.equal(toPlaying(toPaused(round)).status, 'playing')
	assert.equal(toTitle(round).status, 'title')
})