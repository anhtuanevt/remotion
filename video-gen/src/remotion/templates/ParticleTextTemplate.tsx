'use client'
import { useCurrentFrame, AbsoluteFill, Audio, Sequence } from 'remotion'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff']

// Seeded deterministic pseudo-random (mulberry32) — avoids Math.random in render
function seededRng(seed: number) {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ─── Background particles — position driven by frame time ────────────────────
function BackgroundParticles({ t }: { t: number }) {
  const meshRef = useRef<THREE.Points>(null!)

  const count = 300
  const basePositions = useMemo(() => {
    const rng = seededRng(42)
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (rng() - 0.5) * 20
      pos[i * 3 + 1] = (rng() - 0.5) * 36
      pos[i * 3 + 2] = (rng() - 0.5) * 5
    }
    return pos
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array
    const speed = 0.015
    for (let i = 0; i < count; i++) {
      // Deterministic drift: use base y + t-based offset, wrap around
      const baseY = basePositions[i * 3 + 1]
      pos[i * 3]     = basePositions[i * 3]
      pos[i * 3 + 1] = ((baseY + t * speed * FPS + 18) % 36) - 18
      pos[i * 3 + 2] = basePositions[i * 3 + 2]
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
    meshRef.current.rotation.y = t * 0.1
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[basePositions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.04} transparent opacity={0.25} sizeAttenuation />
    </points>
  )
}

// ─── Orbital ring — rotation driven by frame time ────────────────────────────
function OrbitalRing({ t, color }: { t: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.x = t * 1.2
    ref.current.rotation.y = t * 0.8
  })
  return (
    <mesh ref={ref}>
      <torusGeometry args={[2.8, 0.04, 8, 80]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  )
}

// ─── Entry burst particles ────────────────────────────────────────────────────
function EntryBurst({ burstProgress, color }: { burstProgress: number; color: string }) {
  const count = 120
  const velocities = useMemo(() => {
    const rng = seededRng(99)
    const v = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2
      const phi   = Math.acos(2 * rng() - 1)
      const r     = 2.5 + rng() * 1.5
      v[i * 3]     = Math.sin(phi) * Math.cos(theta) * r
      v[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r
      v[i * 3 + 2] = Math.cos(phi) * r
    }
    return v
  }, [])

  // peaks at burstProgress = 0.5
  const burst = Math.sin(burstProgress * Math.PI)
  const pos = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3]     = velocities[i * 3]     * burst
      p[i * 3 + 1] = velocities[i * 3 + 1] * burst
      p[i * 3 + 2] = velocities[i * 3 + 2] * burst
    }
    return p
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst, velocities])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.07}
        transparent
        opacity={0.8 * burst}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Three.js scene ───────────────────────────────────────────────────────────
function Scene({
  localFrame,
  colorIndex,
}: {
  localFrame: number
  colorIndex: number
}) {
  const t = localFrame / FPS
  const color = COLORS[colorIndex % COLORS.length]
  const burstProgress = Math.min(localFrame / (FPS * 0.5), 1)

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 5]} intensity={1.5} color={color} />
      <BackgroundParticles t={t} />
      <OrbitalRing t={t} color={color} />
      {burstProgress < 1 && <EntryBurst burstProgress={burstProgress} color={color} />}
    </>
  )
}

// ─── HTML text overlay ────────────────────────────────────────────────────────
function TextOverlay({
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
  const color = COLORS[colorIndex % COLORS.length]

  const fadeIn  = Math.min(localFrame / 12, 1)
  const fadeOut = localFrame > durationFrames - 12
    ? 1 - (localFrame - (durationFrames - 12)) / 12
    : 1
  const opacity    = fadeIn * fadeOut
  const translateY = (1 - fadeIn) * 40

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* Glow ring */}
      <div style={{
        position: 'absolute',
        width: 320, height: 320,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        boxShadow: `0 0 40px ${color}60, inset 0 0 40px ${color}20`,
        opacity: opacity * 0.7,
        transform: `scale(${0.8 + fadeIn * 0.2})`,
      }} />

      {/* Main text */}
      <div style={{
        fontSize: 72, fontWeight: 900, color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center', lineHeight: 1.2,
        padding: '0 80px',
        opacity,
        transform: `translateY(${translateY}px)`,
        textShadow: `0 0 30px ${color}, 0 0 60px ${color}60`,
        letterSpacing: -1,
        zIndex: 10,
      }}>
        {seg.text}
      </div>

      {seg.subtitle && (
        <div style={{
          marginTop: 28, fontSize: 38, color,
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center', padding: '0 80px',
          opacity: opacity * 0.9,
          transform: `translateY(${translateY}px)`,
          fontWeight: 600, letterSpacing: 2,
          textTransform: 'uppercase',
          zIndex: 10,
        }}>
          {seg.subtitle}
        </div>
      )}

      {/* Bottom pulse bar */}
      <div style={{
        position: 'absolute', bottom: 80,
        width: `${40 + fadeIn * 40}%`, height: 4,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        borderRadius: 2, opacity,
        boxShadow: `0 0 12px ${color}`,
      }} />
    </AbsoluteFill>
  )
}

// ─── Per-segment wrapper ───────────────────────────────────────────────────────
function ParticleSegment({
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
      <AbsoluteFill style={{ background: '#050510' }}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 0, 8], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene localFrame={local} colorIndex={segIndex} />
        </Canvas>
      </AbsoluteFill>

      <TextOverlay
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
export function ParticleTextTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#050510' }}>
      {segFrames.map((seg, i) => (
        <ParticleSegment
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
