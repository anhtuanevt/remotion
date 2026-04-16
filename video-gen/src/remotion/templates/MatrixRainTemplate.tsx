'use client'
import { useCurrentFrame, AbsoluteFill, Audio, Sequence } from 'remotion'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const MATRIX_GREEN = '#00ff41'
const ACCENT_COLORS = ['#00ff41', '#00ffcc', '#39ff14', '#7fff00', '#00e5ff']

// Seeded deterministic RNG (mulberry32)
function seededRng(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const MATRIX_CHARS = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF<>{}[]|/'

// ─── 3D falling column of glowing boxes (represent character cells) ───────────
function MatrixColumn({
  x,
  speed,
  length,
  t,
  color,
}: {
  x: number
  speed: number
  length: number
  t: number
  color: string
}) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (!groupRef.current) return
    // Wrap column around vertically
    const y = (((-t * speed) % 20) + 20) % 20 - 10
    groupRef.current.position.y = y
  })

  const boxes = useMemo(() => {
    return Array.from({ length }, (_, i) => i)
  }, [length])

  return (
    <group ref={groupRef} position={[x, 0, 0]}>
      {boxes.map((i) => {
        const alpha = 1 - i / length
        return (
          <mesh key={i} position={[0, -i * 0.55, 0]}>
            <planeGeometry args={[0.4, 0.45]} />
            <meshBasicMaterial
              color={i === 0 ? '#ffffff' : color}
              transparent
              opacity={i === 0 ? 1 : alpha * 0.75}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Full matrix rain scene ───────────────────────────────────────────────────
function MatrixScene({ t, colorIndex }: { t: number; colorIndex: number }) {
  const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length]

  const columns = useMemo(() => {
    const rng = seededRng(colorIndex * 100 + 7)
    return Array.from({ length: 22 }, (_, i) => ({
      x: -5.25 + i * 0.5,
      speed: 1.5 + rng() * 3,
      length: Math.floor(5 + rng() * 10),
      offset: rng() * 20,
    }))
  }, [colorIndex])

  return (
    <>
      <ambientLight intensity={0.1} />
      {columns.map((col, i) => (
        <MatrixColumn
          key={i}
          x={col.x}
          speed={col.speed}
          length={col.length}
          t={t + col.offset}
          color={color}
        />
      ))}
    </>
  )
}

// ─── HTML overlay: glitch text ────────────────────────────────────────────────
function GlitchTextOverlay({
  seg,
  localFrame,
  durationFrames,
  colorIndex,
}: {
  seg: Segment
  localFrame: number
  durationFrames: number
  colorIndex: number
}) {
  const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length]

  const fadeIn  = Math.min(localFrame / 10, 1)
  const fadeOut = localFrame > durationFrames - 10
    ? 1 - (localFrame - (durationFrames - 10)) / 10
    : 1
  const opacity = fadeIn * fadeOut

  // Glitch offset: a few frames at intervals
  const glitchActive = localFrame % 47 < 3 || localFrame % 83 < 2
  const glitchX = glitchActive ? (localFrame % 3 === 0 ? -6 : 4) : 0
  const glitchY = glitchActive ? (localFrame % 2 === 0 ? 3 : -3) : 0

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* Dark vignette behind text */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
      }} />

      {/* Decorative top/bottom bars */}
      <div style={{
        position: 'absolute', top: 120, left: 60, right: 60,
        height: 2, background: color,
        boxShadow: `0 0 8px ${color}`,
        opacity: opacity,
      }} />
      <div style={{
        position: 'absolute', bottom: 120, left: 60, right: 60,
        height: 2, background: color,
        boxShadow: `0 0 8px ${color}`,
        opacity: opacity,
      }} />

      {/* Main text with glitch */}
      <div style={{
        fontSize: 66, fontWeight: 900,
        color: '#ffffff',
        fontFamily: '"Courier New", monospace',
        textAlign: 'center',
        lineHeight: 1.25,
        padding: '0 80px',
        opacity,
        transform: `translate(${glitchX}px, ${glitchY}px)`,
        textShadow: `0 0 20px ${color}, 0 0 40px ${color}80`,
        letterSpacing: 2,
        zIndex: 10,
      }}>
        {seg.text}
      </div>

      {/* Glitch clone layer */}
      {glitchActive && (
        <div style={{
          position: 'absolute',
          fontSize: 66, fontWeight: 900,
          color: color,
          fontFamily: '"Courier New", monospace',
          textAlign: 'center',
          lineHeight: 1.25,
          padding: '0 80px',
          opacity: opacity * 0.4,
          transform: `translate(${glitchX + 8}px, ${glitchY}px)`,
          mixBlendMode: 'screen',
          letterSpacing: 2,
          zIndex: 9,
        }}>
          {seg.text}
        </div>
      )}

      {seg.subtitle && (
        <div style={{
          marginTop: 32, fontSize: 36,
          color: MATRIX_GREEN,
          fontFamily: '"Courier New", monospace',
          textAlign: 'center',
          padding: '0 80px',
          opacity: opacity * 0.9,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: 'uppercase',
          textShadow: `0 0 10px ${MATRIX_GREEN}`,
          zIndex: 10,
        }}>
          {'> '}{seg.subtitle}
        </div>
      )}
    </AbsoluteFill>
  )
}

// ─── Per-segment wrapper ───────────────────────────────────────────────────────
function MatrixSegment({
  seg,
  startFrame,
  durationFrames,
  segIndex,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
  segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#000300' }}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 0, 8], fov: 60 }}
          gl={{ antialias: false, alpha: false }}
        >
          <MatrixScene t={local / FPS} colorIndex={segIndex} />
        </Canvas>
      </AbsoluteFill>

      <GlitchTextOverlay
        seg={seg}
        localFrame={local}
        durationFrames={durationFrames}
        colorIndex={segIndex}
      />

      {seg.audioUrl && <Audio src={seg.audioUrl} />}
    </Sequence>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function MatrixRainTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#000300' }}>
      {segFrames.map((seg, i) => (
        <MatrixSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
          segIndex={i}
        />
      ))}
    </AbsoluteFill>
  )
}

// Export char list for potential future use
export { MATRIX_CHARS }
