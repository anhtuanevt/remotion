'use client'
import { useCurrentFrame, AbsoluteFill, Audio, Sequence } from 'remotion'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

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

// ─── Star field with parallax layers ─────────────────────────────────────────
function StarField({ t, layer, count, spread, depth, speed }: {
  t: number
  layer: number
  count: number
  spread: number
  depth: number
  speed: number
}) {
  const meshRef = useRef<THREE.Points>(null!)

  const { positions, colors } = useMemo(() => {
    const rng = seededRng(layer * 1000 + 13)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (rng() - 0.5) * spread
      pos[i * 3 + 1] = (rng() - 0.5) * spread * 1.8
      pos[i * 3 + 2] = (rng() - 0.5) * depth
      // Star color: mostly white, some blue/yellow tints
      const tint = rng()
      if (tint > 0.85) { col[i*3]=0.6; col[i*3+1]=0.8; col[i*3+2]=1.0 }  // blue
      else if (tint > 0.7) { col[i*3]=1.0; col[i*3+1]=0.95; col[i*3+2]=0.7 }  // warm
      else { col[i*3]=1.0; col[i*3+1]=1.0; col[i*3+2]=1.0 }  // white
    }
    return { positions: pos, colors: col }
  }, [layer, count, spread, depth])

  useFrame(() => {
    if (!meshRef.current) return
    // Slow rightward drift = parallax pan
    meshRef.current.rotation.y = t * speed * 0.05
    meshRef.current.rotation.x = Math.sin(t * speed * 0.02) * 0.03
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015 + layer * 0.01}
        vertexColors
        transparent
        opacity={0.6 + layer * 0.15}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Spiral galaxy arms ───────────────────────────────────────────────────────
function GalaxyArms({ t, colorIndex }: { t: number; colorIndex: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const PALETTE = [
    ['#ff6b9d', '#c44dff', '#4d79ff'],
    ['#ffd93d', '#ff6b35', '#ff3d71'],
    ['#39ff14', '#00e5ff', '#7b2fff'],
    ['#ff4d4d', '#ff9f1c', '#ffbf69'],
  ]
  const palette = PALETTE[colorIndex % PALETTE.length]

  const { positions, colors } = useMemo(() => {
    const rng = seededRng(colorIndex * 50 + 3)
    const armCount = 2
    const starsPerArm = 400
    const total = armCount * starsPerArm
    const pos = new Float32Array(total * 3)
    const col = new Float32Array(total * 3)

    for (let arm = 0; arm < armCount; arm++) {
      const armAngleOffset = (arm / armCount) * Math.PI * 2
      const c = new THREE.Color(palette[arm % palette.length])

      for (let s = 0; s < starsPerArm; s++) {
        const idx = (arm * starsPerArm + s) * 3
        const r = 0.2 + (s / starsPerArm) * 3.5
        const angle = armAngleOffset + (s / starsPerArm) * Math.PI * 4
        const spread = (rng() - 0.5) * 0.4 * r

        pos[idx]     = Math.cos(angle) * r + spread
        pos[idx + 1] = (rng() - 0.5) * 0.3
        pos[idx + 2] = Math.sin(angle) * r + spread

        const brightness = 1 - s / starsPerArm * 0.6
        col[idx]     = c.r * brightness
        col[idx + 1] = c.g * brightness
        col[idx + 2] = c.b * brightness
      }
    }
    return { positions: pos, colors: col }
  }, [colorIndex, palette])

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = t * 0.12
    groupRef.current.rotation.x = 0.35 + Math.sin(t * 0.08) * 0.05
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} vertexColors transparent opacity={0.85} sizeAttenuation />
      </points>
      {/* Bright core */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      {/* Core glow halo */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={palette[0]} transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

// ─── Shooting star ────────────────────────────────────────────────────────────
function ShootingStar({ t, seed }: { t: number; seed: number }) {
  const rng = useMemo(() => {
    const r = seededRng(seed)
    return { x: (r() - 0.5) * 10, y: r() * 8 - 2, angle: r() * 0.5 - 0.25 }
  }, [seed])

  const period = 3.0
  const phase  = (t % period) / period

  if (phase > 0.4) return null

  const x = rng.x + Math.cos(rng.angle) * phase * 6
  const y = rng.y - Math.sin(rng.angle + 0.5) * phase * 3
  const opacity = phase < 0.1 ? phase / 0.1 : 1 - (phase - 0.1) / 0.3

  return (
    <mesh position={[x, y, 1]} rotation={[0, 0, rng.angle + Math.PI / 4]}>
      <planeGeometry args={[0.6 * (1 - phase * 0.5), 0.015]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.9} />
    </mesh>
  )
}

// ─── Full galaxy scene ────────────────────────────────────────────────────────
function GalaxyScene({ t, colorIndex }: { t: number; colorIndex: number }) {
  return (
    <>
      <ambientLight intensity={0.05} />
      {/* Three parallax star layers */}
      <StarField t={t} layer={0} count={400} spread={18} depth={8} speed={0.3} />
      <StarField t={t} layer={1} count={200} spread={14} depth={6} speed={0.6} />
      <StarField t={t} layer={2} count={80}  spread={10} depth={4} speed={1.0} />
      {/* Spiral galaxy */}
      <GalaxyArms t={t} colorIndex={colorIndex} />
      {/* Shooting stars at different seeds */}
      <ShootingStar t={t}            seed={colorIndex * 10 + 1} />
      <ShootingStar t={t + 1.1}      seed={colorIndex * 10 + 2} />
      <ShootingStar t={t + 2.3}      seed={colorIndex * 10 + 3} />
    </>
  )
}

// ─── HTML text overlay ────────────────────────────────────────────────────────
function SpaceTextOverlay({
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
  const PALETTE = ['#c44dff', '#ff6b35', '#00e5ff', '#ff4d4d']
  const color = PALETTE[colorIndex % PALETTE.length]

  const fadeIn  = Math.min(localFrame / 18, 1)
  const fadeOut = localFrame > durationFrames - 18
    ? 1 - (localFrame - (durationFrames - 18)) / 18
    : 1
  const opacity    = fadeIn * fadeOut
  const scale      = 0.85 + fadeIn * 0.15
  const translateY = (1 - fadeIn) * 50

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* Dark overlay so text is readable over the galaxy */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 100%)',
      }} />

      {/* Starlight halo behind text */}
      <div style={{
        position: 'absolute',
        width: 500, height: 300,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${color}18 0%, transparent 70%)`,
        opacity: opacity,
        transform: `scale(${scale})`,
      }} />

      {/* Main text */}
      <div style={{
        fontSize: 68, fontWeight: 900,
        color: '#f0f0ff',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        lineHeight: 1.22,
        padding: '0 80px',
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        textShadow: `0 0 24px ${color}cc, 0 2px 40px rgba(0,0,0,0.8)`,
        letterSpacing: -0.5,
        zIndex: 10,
      }}>
        {seg.text}
      </div>

      {seg.subtitle && (
        <div style={{
          marginTop: 30, fontSize: 36,
          color: color,
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '0 80px',
          opacity: opacity * 0.9,
          transform: `translateY(${translateY}px)`,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: 'uppercase',
          textShadow: `0 0 12px ${color}`,
          zIndex: 10,
        }}>
          {seg.subtitle}
        </div>
      )}

      {/* Floating particles decoration */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 4, height: 4,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          left: `${15 + i * 17}%`,
          top: `${30 + (i % 3) * 15}%`,
          opacity: opacity * (0.4 + (i % 3) * 0.2),
          transform: `translateY(${Math.sin(localFrame / 20 + i) * 8}px)`,
        }} />
      ))}
    </AbsoluteFill>
  )
}

// ─── Per-segment wrapper ───────────────────────────────────────────────────────
function GalaxySegment({
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
      <AbsoluteFill style={{ background: '#03000f' }}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 1.5, 7], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
        >
          <GalaxyScene t={local / FPS} colorIndex={segIndex} />
        </Canvas>
      </AbsoluteFill>

      <SpaceTextOverlay
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
export function GalaxyTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#03000f' }}>
      {segFrames.map((seg, i) => (
        <GalaxySegment
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
