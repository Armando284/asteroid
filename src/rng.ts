// ASTEROID.EXE — deterministic mulberry32 PRNG, the same generator the rest
// of the arcade collection uses so tests can replay exact scenarios.

export type Rng = () => number

export function mulberry32(seed: number): Rng {
	let a = seed >>> 0

	return function rng(): number {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

// A random number in [min, max).
export function range(rng: Rng, min: number, max: number): number {
	return min + rng() * (max - min)
}

// A normally-ish distributed "speed" flavor: (min + rng*(max-min)) with a
// 30% chance of a notable outlier so the field never moves in lockstep.
export function speed(rng: Rng, min: number, max: number): number {
	const base = range(rng, min, max)

	if (rng() < 0.3) {
		return base * 1.35
	}

	return base
}