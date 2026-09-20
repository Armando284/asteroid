// ASTEROID.EXE — game orchestrator. Owns the input map, the frame loop,
// collisions, waves, lives and the interaction between the pure modules
// above. Rendering and audio stay in renderer/audio.

import {
	ASTEROID_POINTS,
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	DEATH_DURATION,
	FIRE_COOLDOWN,
	INVINCIBLE_DURATION,
	MAX_BULLETS,
	PALETTE,
	PLAY_BOTTOM,
	PLAY_LEFT,
	PLAY_RIGHT,
	PLAY_TOP,
	WAVE_BANNER_DURATION,
	WAVE_BONUS,
} from './constants.ts'
import type { Asteroid } from './asteroid.ts'
import { spawnAsteroid, splitAsteroid, waveCount, waveSpeedFactor } from './asteroid.ts'
import type { Renderer } from './renderer.ts'
import type { Ship } from './ship.ts'
import { makeShip, updateShip, wrapShip } from './ship.ts'
import type { Projectile } from './projectile.ts'
import { makeProjectile, stepProjectile } from './projectile.ts'
import type { Round } from './round.ts'
import { addScore, clearWave, freshRound, loseLife, startRun, toPaused, toPlaying, toTitle } from './round.ts'
import type { Particle, Popup } from './effects.ts'
import { pruneFx, spawnBurst, spawnPopup, stepParticles, stepPopups } from './effects.ts'
import { circlesOverlap, wrap } from './geometry.ts'
import type { Rect } from './geometry.ts'
import { mulberry32 } from './rng.ts'
import type { Rng } from './rng.ts'
import type { Sfx } from './audio.ts'
import type { StorageLike } from './persist.ts'
import { saveHighScore } from './persist.ts'
import type { Vector2 } from './vector.ts'

const FIELD: Rect = {
	left: PLAY_LEFT,
	top: PLAY_TOP,
	right: PLAY_RIGHT,
	bottom: PLAY_BOTTOM,
}

const SPAWN_KEEPOUT_DISTANCE = 130
const SHIP_NOSE = 15

interface Star {
	x: number
	y: number
	twinkle: number
}

interface GameElements {
	readonly ctx: CanvasRenderingContext2D
	readonly renderer: Renderer
	readonly sfx: Sfx
	readonly storage: StorageLike
}

export class Game {
	private readonly elements: GameElements
	private readonly rng: Rng

	private round: Round
	private ship: Ship
	private shipAlive = false
	private invincibleTimer = 0
	private deathTimer = 0
	private fireCooldown = 0
	private waveTimer = 0
	private thrustSfxTimer = 0
	private nextAsteroidId = 1

	private asteroids: Asteroid[] = []
	private projectiles: Projectile[] = []
	private particles: Particle[] = []
	private popups: Popup[] = []

	private keys = new Set<string>()
	private muted = false
	private rafId = 0
	private lastTime = 0
	private currentTime = 0

	private stars: Star[] = []

	constructor(elements: GameElements) {
		this.elements = elements
		this.rng = mulberry32(1)
		this.round = freshRound(0)
		this.ship = makeShip(FIELD)

		this.stars = Array.from({ length: 34 }, () => ({
			x: this.rng() * CANVAS_WIDTH,
			y: this.rng() * (CANVAS_HEIGHT - PLAY_TOP) + PLAY_TOP,
			twinkle: this.rng() * Math.PI * 2,
		}))
	}

	start(initialHiScore: number): void {
		this.round = freshRound(initialHiScore)
		this.bindInput()
		this.lastTime = performance.now()
		this.rafId = requestAnimationFrame(this.loop)
	}

	destroy(): void {
		cancelAnimationFrame(this.rafId)
		window.removeEventListener('keydown', this.onKeyDown)
		window.removeEventListener('keyup', this.onKeyUp)
	}

	// ---- input ---------------------------------------------------------

	private bindInput(): void {
		window.addEventListener('keydown', this.onKeyDown)
		window.addEventListener('keyup', this.onKeyUp)
	}

	private handleKey(command: string): void {
		switch (command) {
			case 'start':
				if (this.round.status === 'title' || this.round.status === 'gameover') {
					this.beginRun()
				} else if (this.round.status === 'paused') {
					this.round = toPlaying(this.round)
				}
				break

			case 'pause':
				if (this.round.status === 'playing') {
					this.round = toPaused(this.round)
				} else if (this.round.status === 'paused') {
					this.round = toPlaying(this.round)
				}
				break

			case 'quit':
				if (this.round.status === 'gameover') {
					this.round = toTitle(this.round)
					this.clearEntities()
				}
				break

			case 'mute':
				this.muted = !this.muted
				this.elements.sfx.enabled = !this.muted
				break
		}
	}

	private readonly onKeyDown = (event: KeyboardEvent): void => {
		if (event.code === 'Space' || event.code === 'Enter') {
			event.preventDefault()
		}

		this.keys.add(event.code)

		switch (event.code) {
			case 'Enter':
				this.handleKey('start')
				break
			case 'KeyP':
			case 'Escape':
				this.handleKey('pause')
				break
			case 'KeyQ':
				this.handleKey('quit')
				break
			case 'KeyM':
				this.handleKey('mute')
				break
		}
	}

	private readonly onKeyUp = (event: KeyboardEvent): void => {
		this.keys.delete(event.code)
	}

	// ---- run lifecycle -------------------------------------------------

	private beginRun(): void {
		this.round = startRun(this.round)
		this.clearEntities()
		this.spawnShip()
		this.spawnWave()
		this.waveTimer = WAVE_BANNER_DURATION
	}

	private clearEntities(): void {
		this.asteroids = []
		this.projectiles = []
		this.particles = []
		this.popups = []
	}

	private spawnShip(): void {
		this.ship = makeShip(FIELD)
		this.shipAlive = true
		this.invincibleTimer = INVINCIBLE_DURATION
		this.deathTimer = 0
	}

	private spawnWave(): void {
		const count = waveCount(this.round.wave)
		const speedFactor = waveSpeedFactor(this.round.wave)

		for (let index = 0; index < count; index++) {
			const rock = spawnAsteroid(
				this.nextAsteroidId + index,
				'large',
				FIELD,
				this.rng,
				this.shipAlive ? [this.ship.position] : [],
				SPAWN_KEEPOUT_DISTANCE,
			)
			rock.velocity.x *= speedFactor
			rock.velocity.y *= speedFactor
			this.asteroids.push(rock)
		}

		this.nextAsteroidId += count
	}

	// ---- main loop -----------------------------------------------------

	private readonly loop = (now: number): void => {
		this.rafId = requestAnimationFrame(this.loop)

		const dt = Math.min((now - this.lastTime) / 1000, 1 / 30)
		this.lastTime = now
		this.currentTime = now / 1000

		this.elements.renderer.stamp(this.currentTime)
		this.update(dt)
		this.draw()
	}

	private update(dt: number): void {
		if (this.round.status === 'playing') {
			this.updatePlaying(dt)
		}
	}

	private updatePlaying(dt: number): void {
		if (this.waveTimer > 0) {
			this.waveTimer -= dt
		}

		this.updateStars(dt)

		if (this.shipAlive) {
			this.updatePlayerInput(dt)
		} else if (this.deathTimer > 0) {
			this.deathTimer -= dt
			if (this.deathTimer <= 0) {
				this.respawnIfPossible()
			}
		}

		if (this.fireCooldown > 0) {
			this.fireCooldown -= dt
		}

		this.updateProjectiles(dt)
		this.updateAsteroids(dt)
		this.checkCollisions()

		if (this.shipAlive) {
			if (this.invincibleTimer > 0) {
				this.invincibleTimer -= dt
			}

			if (this.asteroids.length === 0) {
				this.nextWave()
			}
		}

		stepParticles(this.particles, dt)
		stepPopups(this.popups, dt)
		pruneFx(this.particles, this.popups)
	}

	private updateStars(dt: number): void {
		for (const star of this.stars) {
			star.y += 14 * dt
			if (star.y > CANVAS_HEIGHT) {
				star.y = PLAY_TOP
				star.x = (star.x + 47) % CANVAS_WIDTH
			}
		}
	}

	private updatePlayerInput(dt: number): void {
		const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA')
		const right = this.keys.has('ArrowRight') || this.keys.has('KeyD')
		const thrust = this.keys.has('ArrowUp') || this.keys.has('KeyW')

		updateShip(this.ship, {
			turn: ((left ? -1 : 0) + (right ? 1 : 0)) as -1 | 0 | 1,
			thrust,
		}, dt)
		wrapShip(this.ship, FIELD)

		if (thrust) {
			this.thrustSfxTimer -= dt
			if (this.thrustSfxTimer <= 0) {
				this.elements.sfx.thrust()
				this.thrustSfxTimer = 0.12
			}
		} else {
			this.thrustSfxTimer = 0
		}

		if (this.keys.has('Space') || this.keys.has('KeyJ')) {
			this.tryFire()
		}
	}

	private tryFire(): void {
		if (this.fireCooldown > 0 || this.projectiles.length >= MAX_BULLETS) {
			return
		}

		this.projectiles.push(makeProjectile(this.nose(), this.ship.velocity, this.ship.rotation))
		this.fireCooldown = FIRE_COOLDOWN
		this.elements.sfx.fire()
	}

	private nose(): Vector2 {
		return {
			x: this.ship.position.x + Math.cos(this.ship.rotation) * SHIP_NOSE,
			y: this.ship.position.y + Math.sin(this.ship.rotation) * SHIP_NOSE,
		}
	}

	private updateProjectiles(dt: number): void {
		for (let index = this.projectiles.length - 1; index >= 0; index--) {
			if (!stepProjectile(this.projectiles[index]!, dt, FIELD)) {
				this.projectiles.splice(index, 1)
			}
		}
	}

	private updateAsteroids(dt: number): void {
		for (const rock of this.asteroids) {
			rock.position.x = wrap(rock.position.x + rock.velocity.x * dt, PLAY_LEFT, PLAY_RIGHT)
			rock.position.y = wrap(rock.position.y + rock.velocity.y * dt, PLAY_TOP, PLAY_BOTTOM)
			rock.rotation += rock.rotationSpeed * dt
		}
	}

	private checkCollisions(): void {
		for (let bulletIndex = this.projectiles.length - 1; bulletIndex >= 0; bulletIndex--) {
			const bullet = this.projectiles[bulletIndex]!

			for (let rockIndex = this.asteroids.length - 1; rockIndex >= 0; rockIndex--) {
				const rock = this.asteroids[rockIndex]!

				if (!circlesOverlap(bullet.position, bullet.radius, rock.position, rock.radius)) {
					continue
				}

				this.projectiles.splice(bulletIndex, 1)
				this.destroyAsteroid(rock, rockIndex)
				break
			}
		}

		if (this.shipAlive && this.invincibleTimer <= 0) {
			for (const rock of this.asteroids) {
				if (circlesOverlap(this.ship.position, this.ship.radius, rock.position, rock.radius)) {
					this.shipDestroyed()
					break
				}
			}
		}
	}

	private destroyAsteroid(rock: Asteroid, rockIndex: number): void {
		this.asteroids.splice(rockIndex, 1)

		const points = ASTEROID_POINTS[rock.size]
		this.round = addScore(this.round, points)

		spawnBurst(
			this.particles,
			rock.position,
			this.rng,
			14 + (rock.size === 'large' ? 10 : rock.size === 'medium' ? 6 : 4),
			this.burstColor(rock.size),
			150,
		)

		spawnPopup(this.popups, rock.position, `+${points}`, this.burstColor(rock.size), 'score')

		const fragments = splitAsteroid(rock, this.nextAsteroidId, this.rng, this.asteroids.length)
		if (fragments.length > 0) {
			this.nextAsteroidId += fragments.length
			this.asteroids.push(...fragments)
		}

		this.elements.sfx.hit(rock.size !== 'small')

		this.persistHiScore()
	}

	private persistHiScore(): void {
		if (this.round.score > this.round.hiScore) {
			saveHighScore(this.elements.storage, this.round.score)
		}
	}

	private burstColor(size: string): string {
		if (size === 'large') return PALETTE.line
		if (size === 'medium') return PALETTE.hud
		return PALETTE.bright
	}

	private shipDestroyed(): void {
		this.shipAlive = false
		this.deathTimer = DEATH_DURATION
		this.round = loseLife(this.round)

		spawnBurst(this.particles, this.ship.position, this.rng, 30, PALETTE.bright, 220)
		spawnBurst(this.particles, this.ship.position, this.rng, 18, PALETTE.gold, 150)
		this.elements.sfx.explode()

		if (this.round.status === 'gameover') {
			this.persistHiScore()
			this.elements.sfx.gameover()
		}
	}

	private respawnIfPossible(): void {
		if (this.round.lives > 0) {
			this.spawnShip()
		}
	}

	private nextWave(): void {
		this.round = clearWave(this.round)

		spawnPopup(
			this.popups,
			{ x: CANVAS_WIDTH / 2, y: FIELD.top + 40 },
			`WAVE ${this.round.wave} +${WAVE_BONUS}`,
			PALETTE.gold,
			'wave',
		)

		this.waveTimer = WAVE_BANNER_DURATION
		this.spawnWave()
		this.elements.sfx.wave()
	}

	// ---- drawing --------------------------------------------------------

	private draw(): void {
		const { renderer } = this.elements

		renderer.reset()
		renderer.background()
		renderer.hud(this.round, true)

		switch (this.round.status) {
			case 'title':
				this.drawStars()
				renderer.title()
				break

			case 'playing':
				this.drawStars()
				for (const rock of this.asteroids) {
					renderer.asteroid(rock, FIELD)
				}
				for (const shot of this.projectiles) {
					renderer.projectile(shot)
				}
				if (this.shipAlive) {
					const blink = this.invincibleTimer > 0 && Math.floor(this.currentTime * 12) % 2 === 0
					const thrusting = this.keys.has('ArrowUp') || this.keys.has('KeyW')
					renderer.ship(this.ship, thrusting, blink)
				}
				renderer.particles(this.particles)
				for (const popup of this.popups) {
					renderer.popup(popup)
				}
				renderer.waveBanner(this.round.wave, this.waveTimer)
				break

			case 'paused':
				this.drawStars()
				renderer.paused()
				break

			case 'gameover':
				this.drawStars()
				renderer.particles(this.particles)
				renderer.gameover(this.round.newHi || this.round.score >= this.round.hiScore)
				break
		}
	}

	private drawStars(): void {
		const { ctx } = this.elements
		ctx.fillStyle = PALETTE.dimLine
		for (const star of this.stars) {
			const alpha = 0.4 + 0.6 * Math.abs(Math.sin(this.currentTime + star.twinkle * 3))
			ctx.globalAlpha = alpha
			ctx.fillRect(star.x, star.y, 2, 2)
			ctx.globalAlpha = 1
		}
	}
}