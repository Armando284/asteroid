// ASTEROID.EXE — tiny WebAudio synthesizer for retro terminal effects.
// Everything is generated from oscillators at runtime: no audio assets.

export interface Sfx {
	enabled: boolean
	thrust(): void
	fire(): void
	hit(large: boolean): void
	explode(): void
	wave(): void
	gameover(): void
}

export interface SfxOptions {
	enabled?: boolean
}

export function createSfx(
	ctx: AudioContext,
	options: SfxOptions = {},
): Sfx {
	const sfx: Sfx = {
		enabled: options.enabled ?? true,
		thrust: () => undefined,
		fire: () => undefined,
		hit: () => undefined,
		explode: () => undefined,
		wave: () => undefined,
		gameover: () => undefined,
	}

	function tone(
		frequencyStart: number,
		frequencyEnd: number,
		duration: number,
		type: OscillatorType,
		gain = 0.08,
		delay = 0,
	): void {
		if (!sfx.enabled) {
			return
		}

		const start = ctx.currentTime + delay
		const oscillator = ctx.createOscillator()
		const envelope = ctx.createGain()

		oscillator.type = type
		oscillator.frequency.setValueAtTime(frequencyStart, start)
		oscillator.frequency.exponentialRampToValueAtTime(
			frequencyEnd,
			start + duration,
		)
		envelope.gain.setValueAtTime(0.0001, start)
		envelope.gain.exponentialRampToValueAtTime(gain, start + 0.008)
		envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)

		oscillator.connect(envelope)
		envelope.connect(ctx.destination)
		oscillator.start(start)
		oscillator.stop(start + duration + 0.02)
	}

	function noise(duration: number, gain = 0.1, delay = 0): void {
		if (!sfx.enabled) {
			return
		}

		const start = ctx.currentTime + delay
		const bufferSize = Math.ceil(ctx.sampleRate * duration)
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
		const data = buffer.getChannelData(0)

		for (let index = 0; index < bufferSize; index++) {
			data[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize)
		}

		const source = ctx.createBufferSource()
		const envelope = ctx.createGain()

		source.buffer = buffer
		envelope.gain.setValueAtTime(gain, start)
		envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)

		source.connect(envelope)
		envelope.connect(ctx.destination)
		source.start(start)
	}

	sfx.thrust = (): void => {
		noise(0.1, 0.03)
		tone(80, 50, 0.12, 'sawtooth', 0.02)
	}

	sfx.fire = (): void => {
		tone(620, 120, 0.09, 'square', 0.03)
	}

	sfx.hit = (large: boolean): void => {
		if (large) {
			noise(0.22, 0.12)
			tone(180, 50, 0.18, 'triangle', 0.04)
		} else {
			noise(0.14, 0.09)
			tone(260, 80, 0.12, 'triangle', 0.03)
		}
	}

	sfx.explode = (): void => {
		noise(0.5, 0.14)
		tone(120, 30, 0.45, 'sawtooth', 0.06)
	}

	sfx.wave = (): void => {
		tone(392, 392, 0.09, 'square', 0.04)
		tone(523, 523, 0.09, 'square', 0.04, 0.1)
		tone(659, 659, 0.12, 'square', 0.04, 0.2)
	}

	sfx.gameover = (): void => {
		tone(330, 330, 0.18, 'square', 0.04)
		tone(247, 247, 0.18, 'square', 0.04, 0.2)
		tone(165, 165, 0.3, 'square', 0.04, 0.4)
	}

	return sfx
}