// ASTEROID.EXE — canvas renderer. Strokes vector shapes and monospace text
// against a phosphor backdrop; nothing here touches game state.

import {
	ASTEROID_POINTS,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	CELL,
	HUD_HEIGHT,
	PALETTE,
	SHIP_LENGTH,
	WAVE_BANNER_DURATION,
	type AsteroidSize,
} from './constants.ts'
import type { Asteroid } from './asteroid.ts'
import type { Ship } from './ship.ts'
import type { Projectile } from './projectile.ts'
import type { Particle, Popup } from './effects.ts'
import type { Round } from './round.ts'
import { pad } from './geometry.ts'
import { fromAngle } from './vector.ts'
import type { Vector2 } from './vector.ts'

export class Renderer {
	private ctx: CanvasRenderingContext2D
	private time = 0

	constructor(ctx: CanvasRenderingContext2D) {
		this.ctx = ctx
	}

	// Frame-clock strobe so the terminal flickers faintly at cycle time.
	stamp(time: number): void {
		this.time = time
	}

	reset(): void {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0)
		this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
	}

	background(): void {
		this.ctx.fillStyle = PALETTE.bg
		this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

		// Closed-field border under the play area.
		this.ctx.strokeStyle = PALETTE.grid
		this.ctx.strokeRect(1, HUD_HEIGHT + 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - HUD_HEIGHT - 2)

		// Faint interior grid.
		this.ctx.beginPath()
		for (let x = CELL; x < CANVAS_WIDTH; x += CELL) {
			this.ctx.moveTo(x + 0.5, HUD_HEIGHT)
			this.ctx.lineTo(x + 0.5, CANVAS_HEIGHT)
		}
		for (let y = HUD_HEIGHT + CELL; y < CANVAS_HEIGHT; y += CELL) {
			this.ctx.moveTo(0, y + 0.5)
			this.ctx.lineTo(CANVAS_WIDTH, y + 0.5)
		}
		this.ctx.strokeStyle = 'rgba(11, 32, 35, 0.35)'
		this.ctx.stroke()

		this.hudBar()
	}

	private hudBar(): void {
		this.ctx.strokeStyle = PALETTE.dimLine
		this.ctx.beginPath()
		this.ctx.moveTo(0, HUD_HEIGHT + 0.5)
		this.ctx.lineTo(CANVAS_WIDTH, HUD_HEIGHT + 0.5)
		this.ctx.stroke()
	}

	hud(round: Round, blinking: boolean): void {
		const tw = String(round.wave)
		const padScore = pad(round.score, 6)
		const padHi = pad(Math.max(round.hiScore, round.score), 6)

		this.ctx.font = `bold 13px "VT323", "IBM Plex Mono", monospace`
		this.text('SCORE ' + padScore, 12, 18, round.newHi ? PALETTE.gold : PALETTE.hud)
		this.text('HI ' + padHi, 12 + CELL * 9, 18, PALETTE.dimLine)

		this.text(blinking ? 'WAVE ' + tw : 'WAVE ' + tw, CANVAS_WIDTH - 90, 18, PALETTE.hud)

		this.text('SHIPS ' + String(Math.max(0, round.lives)).padStart(2, '0'), CANVAS_WIDTH - 90, 34, PALETTE.hud)
	}

	asteroid(rock: Asteroid, field: { left: number; top: number; right: number; bottom: number }): void {
		const offsets: Array<[number, number]> = [[0, 0]]
		const w = field.right - field.left
		const h = field.bottom - field.top

		if (rock.position.x < field.left + rock.radius) offsets.push([-w, 0])
		if (rock.position.x > field.right - rock.radius) offsets.push([w, 0])
		if (rock.position.y < field.top + rock.radius) offsets.push([0, -h])
		if (rock.position.y > field.bottom - rock.radius) offsets.push([0, h])
		// Corners.
		if (offsets.length > 1) {
			if (rock.position.x < field.left + rock.radius && rock.position.y < field.top + rock.radius) offsets.push([-w, -h])
			if (rock.position.x > field.right - rock.radius && rock.position.y < field.top + rock.radius) offsets.push([w, -h])
			if (rock.position.x < field.left + rock.radius && rock.position.y > field.bottom - rock.radius) offsets.push([-w, h])
			if (rock.position.x > field.right - rock.radius && rock.position.y > field.bottom - rock.radius) offsets.push([w, h])
		}

		this.ctx.strokeStyle = this.rockColor(rock.size)
		this.ctx.lineWidth = 1.4

		for (const [ox, oy] of offsets) {
			this.ctx.save()
			this.ctx.translate(rock.position.x + ox, rock.position.y + oy)
			this.ctx.rotate(rock.rotation)

			this.ctx.beginPath()
			const count = rock.vertices.length
			for (let index = 0; index < count; index++) {
				const v = rock.vertices[index]!
				const x = v.x * rock.radius
				const y = v.y * rock.radius
				if (index === 0) {
					this.ctx.moveTo(x, y)
				} else {
					this.ctx.lineTo(x, y)
				}
			}
			this.ctx.closePath()
			this.ctx.stroke()
			this.ctx.restore()
		}
	}

	private rockColor(size: AsteroidSize): string {
		if (size === 'large') return PALETTE.line
		if (size === 'medium') return PALETTE.hud
		return PALETTE.bright
	}

	ship(ship: Ship, thrusting: boolean, blink: boolean): void {
		if (blink) {
			return
		}

		this.ctx.strokeStyle = PALETTE.bright
		this.ctx.lineWidth = 1.6
		this.ctx.save()
		this.ctx.translate(ship.position.x, ship.position.y)
		this.ctx.rotate(ship.rotation)

		this.ctx.beginPath()
		this.ctx.moveTo(SHIP_LENGTH, 0)
		this.ctx.lineTo(-SHIP_LENGTH * 0.6, SHIP_LENGTH * 0.7)
		this.ctx.lineTo(-SHIP_LENGTH * 0.35, 0)
		this.ctx.lineTo(-SHIP_LENGTH * 0.6, -SHIP_LENGTH * 0.7)
		this.ctx.closePath()
		this.ctx.stroke()

		if (thrusting) {
			this.ctx.strokeStyle = PALETTE.gold
			this.ctx.beginPath()
			this.ctx.moveTo(-SHIP_LENGTH * 0.35, 0)
			this.ctx.lineTo(-SHIP_LENGTH * 0.7 - 4 * (1 + Math.sin(this.time * 40)), 0)
			this.ctx.stroke()
		}

		this.ctx.restore()
	}

	projectile(shot: Projectile): void {
		this.ctx.strokeStyle = PALETTE.bright
		this.ctx.lineWidth = 1.6
		this.ctx.beginPath()
		this.ctx.moveTo(shot.position.x - 3, shot.position.y)
		this.ctx.lineTo(shot.position.x + 3, shot.position.y)
		this.ctx.moveTo(shot.position.x, shot.position.y - 3)
		this.ctx.lineTo(shot.position.x, shot.position.y + 3)
		this.ctx.stroke()
	}

	particles(particles: readonly Particle[]): void {
		for (const particle of particles) {
			const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife))
			this.ctx.strokeStyle = particle.color
			this.ctx.globalAlpha = alpha
			this.ctx.lineWidth = particle.size
			this.ctx.beginPath()
			this.ctx.moveTo(particle.position.x, particle.position.y)
			this.ctx.lineTo(particle.position.x + 0.01, particle.position.y)
			this.ctx.stroke()
		}
		this.ctx.globalAlpha = 1
	}

	popup(popup: Popup): void {
		const alpha = Math.max(0, Math.min(1, popup.life / popup.maxLife))
		this.ctx.globalAlpha = alpha
		this.ctx.font = `bold 14px "VT323", "IBM Plex Mono", monospace`
		this.ctx.textAlign = 'center'
		this.text(popup.text, popup.position.x, popup.position.y, popup.color)
		this.ctx.textAlign = 'left'
		this.ctx.globalAlpha = 1
	}

	waveBanner(wave: number, waveTimer: number): void {
		if (waveTimer <= 0 || waveTimer > WAVE_BANNER_DURATION) {
			return
		}

		const y = (CANVAS_HEIGHT - HUD_HEIGHT) / 2 + HUD_HEIGHT
		this.ctx.font = `bold ${CELL * 2}px "VT323", "IBM Plex Mono", monospace`
		this.ctx.textAlign = 'center'
		this.text(`WAVE ${pad(wave, 2)}`, CANVAS_WIDTH / 2, y - 10, PALETTE.bright)
		this.ctx.font = `13px "VT323", "IBM Plex Mono", monospace`
		this.text('SHOT: SPACE   TURN: < >   THRUST: ^', CANVAS_WIDTH / 2, y + 16, PALETTE.hud)
		this.text(`BONUS ${ASTEROID_POINTS.large} ${ASTEROID_POINTS.medium} ${ASTEROID_POINTS.small}`, CANVAS_WIDTH / 2, y + 36, PALETTE.dimLine)
		this.ctx.textAlign = 'left'
	}

	title(): void {
		// Scrolling star background is drawn once per frame over the grid by the
		// game loop; the title only draws text on top.
		this.ctx.font = `bold ${CELL * 3}px "VT323", "IBM Plex Mono", monospace`
		this.ctx.textAlign = 'center'

		const centerY = (CANVAS_HEIGHT - HUD_HEIGHT) / 2 + HUD_HEIGHT
		const twinkle = 0.5 + 0.5 * Math.sin(this.time * 2)

		this.text('ASTEROID', CANVAS_WIDTH / 2, centerY - 46, PALETTE.bright)
		this.text('EXE', CANVAS_WIDTH / 2, centerY - 18, twinkle > 0.8 ? PALETTE.gold : PALETTE.hud)

		this.ctx.font = `13px "VT323", "IBM Plex Mono", monospace`
		this.text('A VECTOR TERMINAL ARCADE', CANVAS_WIDTH / 2, centerY - 1, PALETTE.dimLine)

		if (twinkle > 0.25) {
			this.text('PRESS ENTER TO LAUNCH', CANVAS_WIDTH / 2, centerY + 26, PALETTE.line)
		}
		this.text('TURN < >  THRUST ^  FIRE SPACE', CANVAS_WIDTH / 2, centerY + 46, PALETTE.dim)
		this.text('PAUSE P', CANVAS_WIDTH / 2, centerY + 66, PALETTE.dim)

		this.ctx.textAlign = 'left'
	}

	paused(): void {
		this.ctx.font = `bold ${CELL * 2}px "VT323", "IBM Plex Mono", monospace`
		this.ctx.textAlign = 'center'
		this.text('PAUSED', CANVAS_WIDTH / 2, (CANVAS_HEIGHT - HUD_HEIGHT) / 2 + HUD_HEIGHT, PALETTE.gold)
		this.ctx.font = `13px "VT323", "IBM Plex Mono", monospace`
		this.text('PRESS P TO RESUME', CANVAS_WIDTH / 2, (CANVAS_HEIGHT - HUD_HEIGHT) / 2 + HUD_HEIGHT + 26, PALETTE.hud)
		this.ctx.textAlign = 'left'
	}

	gameover(newHi: boolean): void {
		this.ctx.font = `bold ${CELL * 2.6}px "VT323", "IBM Plex Mono", monospace`
		this.ctx.textAlign = 'center'
		const centerY = (CANVAS_HEIGHT - HUD_HEIGHT) / 2 + HUD_HEIGHT

		this.text('GAME OVER', CANVAS_WIDTH / 2, centerY - 44, PALETTE.red)
		this.ctx.font = `bold 15px "VT323", "IBM Plex Mono", monospace`

		if (newHi) {
			this.text('** NEW HIGH SCORE **', CANVAS_WIDTH / 2, centerY - 12, PALETTE.gold)
		}

		this.ctx.font = `13px "VT323", "IBM Plex Mono", monospace`
		this.text('PRESS ENTER FOR A NEW RUN', CANVAS_WIDTH / 2, centerY + 30, PALETTE.line)
		this.text('PRESS Q FOR TITLE', CANVAS_WIDTH / 2, centerY + 52, PALETTE.dim)
		this.ctx.textAlign = 'left'
	}

	// Basic text helper with a subtle x-scroll offset for the CRT look.
	private text(
		value: string,
		x: number,
		y: number,
		color: string,
	): void {
		this.ctx.fillStyle = color
		this.ctx.fillText(value, x, y)
	}

	// Ship nose position for spawn flashes / shot origin.
	static nose(ship: Ship): Vector2 {
		const direction = fromAngle(ship.rotation)
		return {
			x: ship.position.x + direction.x * SHIP_LENGTH,
			y: ship.position.y + direction.y * SHIP_LENGTH,
		}
	}
}