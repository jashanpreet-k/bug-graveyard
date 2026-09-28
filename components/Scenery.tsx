import styles from './Scenery.module.css'

// Decorative night-time backdrop for the graveyard: stars, moon, drifting fog,
// and a strip of grass. All of it is aria-hidden and ignores the pointer.

export function Sky() {
  return (
    <div className={styles.sky} aria-hidden>
      <div className={styles.stars} />
      <div className={styles.moon} />
      <div className={`${styles.fog} ${styles.fogBack}`} />
      <div className={`${styles.fog} ${styles.fogFront}`} />
    </div>
  )
}

export function Grass() {
  return (
    <svg
      className={styles.grass}
      viewBox={`0 0 ${GRASS_WIDTH} ${GRASS_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={BACK_BLADES} className={styles.grassBack} />
      <path d={FRONT_BLADES} className={styles.grassFront} />
    </svg>
  )
}

const GRASS_WIDTH = 1600
const GRASS_HEIGHT = 64

// Deterministic "random", so the grass is the same on every render.
function noise(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function blades(count: number, seed: number, minHeight: number) {
  const step = GRASS_WIDTH / count
  let d = `M0 ${GRASS_HEIGHT}`
  for (let i = 0; i < count; i++) {
    const x = i * step
    const height = GRASS_HEIGHT * (minHeight + (1 - minHeight) * noise(seed + i))
    const lean = (noise(seed + i + 500) - 0.5) * step * 1.6
    d += ` L${x.toFixed(1)} ${GRASS_HEIGHT}`
    d += ` L${(x + step / 2 + lean).toFixed(1)} ${(GRASS_HEIGHT - height).toFixed(1)}`
    d += ` L${(x + step).toFixed(1)} ${GRASS_HEIGHT}`
  }
  return `${d} Z`
}

const BACK_BLADES = blades(140, 1, 0.45)
const FRONT_BLADES = blades(200, 7, 0.2)
