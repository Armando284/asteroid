// ASTEROID.EXE — localStorage-backed high-score persistence.
// Storage is injected so tests can run it against a fake in-memory store.

import { HI_SCORE_KEY } from './constants.ts'

export interface StorageLike {
	getItem(key: string): string | null
	setItem(key: string, value: string): void
}

export function loadHighScore(storage: StorageLike): number {
	try {
		return Number(storage.getItem(HI_SCORE_KEY)) || 0
	} catch {
		return 0
	}
}

export function saveHighScore(storage: StorageLike, score: number): void {
	try {
		storage.setItem(HI_SCORE_KEY, String(score))
	} catch {
		// storage unavailable — the session just won't persist the high score
	}
}