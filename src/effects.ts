// ASTEROID.EXE — small visual effects helpers: splash particles for asteroid
// fragments and floating score popups. Pure data; the renderer draws them.

import { MAX_PARTICLES, MAX_POPUPS } from './constants.ts'
import type { Rng } from './rng.ts'
import { range } from './rng.ts'
import type { Vector2 } from './vector.ts'
import { fromAngle, scale } from './vector.ts'

export interface Particle {
	position: Vector2
	velocity: Vector2
	life: number
	maxLife: number
	color: string
	size: number
	drag: number
}

export type EffectKind = 'particle' | 'popup'

export type PopupKind = 'score' | 'wave' | 'bonus'

export interface Popup {
	position: Vector2
	text: string
	life: number
	maxLife: number
	color: string
	kind: PopupKind
}

// Burst of short-lived sparks scattering from a point.
export function spawnBurst(
	target: Particle[],
	at: Vector2,
	rng: Rng,
	count: number,
	color: string,
	speed = 120,
	size = 1.6,
	life = 0.55,
): void {
	for (let index = 0; index < count; index++) {
		if (target.length >= MAX_PARTICLES) {
			break
		}

		const angle = range(rng, 0, Math.PI * 2)
		const magnitude = range(rng, speed * 0.3, speed)

		target.push({
			position: { ...at },
			velocity: scale(fromAngle(angle), magnitude),
			life,
			maxLife: life,
			color,
			size: size * range(rng, 0.7, 1.3),
			drag: 1.4,
		})
	}
}

// A text line that drifts up and fades out.
export function spawnPopup(
	target: Popup[],
	at: Vector2,
	text: string,
	color: string,
	kind: PopupKind = 'score',
): void {
	if (target.length >= MAX_POPUPS) {
		target.shift()
	}

	target.push({
		position: { ...at },
		text,
		life: 1,
		maxLife: 1,
		color,
		kind,
	})
}

export function stepParticles(particles: Particle[], dt: number): void {
	for (const particle of particles) {
		particle.life -= dt
		const damping = Math.max(0, 1 - particle.drag * dt)
		particle.velocity.x *= damping
		particle.velocity.y *= damping
		particle.position.x += particle.velocity.x * dt
		particle.position.y += particle.velocity.y * dt
	}
}

export function stepPopups(popups: Popup[], dt: number): void {
	for (const popup of popups) {
		popup.life -= dt
		popup.position.y -= 26 * dt
	}
}

export function pruneFx(
	particles: Particle[],
	popups: Popup[],
): void {
	prune(particles)
	prune(popups)
}

function prune<T extends { life: number }>(list: T[]): void {
	for (let index = list.length - 1; index >= 0; index--) {
		if (list[index] && list[index]!.life <= 0) {
			list.splice(index, 1)
		}
	}
}