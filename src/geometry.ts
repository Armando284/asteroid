// ASTEROID.EXE — pure geometry helpers: screen wrapping, circle collision,
// clamping and the zero-padded terminal number formatting used by the HUD.

export interface Rect {
	left: number
	top: number
	right: number
	bottom: number
}

export interface Point {
	x: number
	y: number
}

// Wrap a coordinate so it stays inside [min, max): moving past one edge
// reappears on the opposite one, exactly like the arcade screen.
export function wrap(value: number, min: number, max: number): number {
	const span = max - min

	if (span <= 0) {
		return min
	}

	return min + (((value - min) % span) + span) % span
}

// Collision test for two circles: squared-distance compare so no sqrt is
// needed. Touching edges (distance === radii sum) counts as a hit.
export function circlesOverlap(
	a: Point,
	aRadius: number,
	b: Point,
	bRadius: number,
): boolean {
	const dx = a.x - b.x
	const dy = a.y - b.y
	const radii = aRadius + bRadius

	return dx * dx + dy * dy <= radii * radii
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

// Zero-pad an integer so the arcade HUD always shows fixed-width values.
export function pad(value: number, width: number): string {
	return String(Math.floor(value)).padStart(width, '0')
}