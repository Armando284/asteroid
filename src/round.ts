// ASTEROID.EXE — the round-level state machine. Lives, score, wave and
// status live here as a small immutable snapshot so the transitions are
// trivially testable without any canvas or DOM.

import { MAX_LIVES, WAVE_BONUS } from './constants.ts'

export type GameStatus = 'title' | 'playing' | 'paused' | 'gameover'

export interface Round {
	status: GameStatus
	score: number
	hiScore: number
	wave: number
	lives: number
	newHi: boolean
}

// A handful of flat bonus points for clearing a single wave.
export function waveBonus(): number {
	return WAVE_BONUS
}

export function freshRound(hiScore: number): Round {
	return {
		status: 'title',
		score: 0,
		hiScore,
		wave: 1,
		lives: MAX_LIVES,
		newHi: false,
	}
}

export function startRun(round: Round): Round {
	return {
		...round,
		status: 'playing',
		score: 0,
		wave: 1,
		lives: MAX_LIVES,
		newHi: false,
	}
}

export function addScore(round: Round, points: number): Round {
	const score = round.score + points
	const newHi = score > round.hiScore

	return {
		...round,
		score,
		hiScore: newHi ? score : round.hiScore,
		newHi: round.newHi || newHi,
	}
}

export function clearWave(round: Round): Round {
	const withBonus = addScore(round, waveBonus())

	return {
		...withBonus,
		wave: round.wave + 1,
	}
}

// Called when the ship is destroyed. If no lives remain the run is over.
export function loseLife(round: Round): Round {
	const lives = round.lives - 1

	return {
		...round,
		lives,
		status: lives <= 0 ? 'gameover' : round.status,
	}
}

export function toTitle(round: Round): Round {
	return { ...round, status: 'title' }
}

export function toPaused(round: Round): Round {
	return { ...round, status: 'paused' }
}

export function toPlaying(round: Round): Round {
	return { ...round, status: 'playing' }
}