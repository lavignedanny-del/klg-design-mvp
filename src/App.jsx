import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const inchesToMeters = (inch) => inch * 0.0254
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const FINISHES = {
  wood: { name: 'Natural Oak', color: '#9c7b55', roughness: 0.7, metalness: 0.0, priceMul: 1.15 },
  grey: { name: 'Matte Grey', color: '#6b7280', roughness: 0.9, metalness: 0.0, priceMul: 1.0 },
  navy: { name: 'Navy', color: '#1f2a44', roughness: 0.8, metalness: 0.0, priceMul: 1.05 },
  white: { name: 'Satin White', color: '#dfe6ee', roughness: 0.85, metalness: 0.0, priceMul: 1.0 },
}
const COUNTERTOPS = {
  quartz:  { name: 'White Quartz', color: '#f5f5f5', roughness: 0.2, metalness: 0.0, priceMul: 1.2, reflect: 0.2 },
  marble:  { name: 'Marble',       color: '#e9edf2', roughness: 0.15, metalness: 0.0, priceMul: 1.35, reflect: 0.3 },
  granite: { name: 'Black Granite',color: '#111214', roughness: 0.1, metalness: 0.0, priceMul: 1.25, reflect: 0.35 },
}
const SINKS = {
  undermount: { name: 'Undermount (Rect.)', type: 'under', priceMul: 1.0 },
  vessel:     { name: 'Vessel (Round)',     type: 'vessel', priceMul: 1.05 },
  slab:       { name: 'Integrated Slab',    type: 'slab', priceMul: 1.2 },
}
const PRESETS = {
  single: { name: 'Single Sink', drawers: 'center' },
  double: { name: 'Double Sink', drawers: 'split' },
  drawer: { name: 'Full Drawer Base', drawers: 'full' },
}

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : initial
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(state)) }, [key, state])
  return [state, setState]
}

function Vanity({ w, h, d, finishKey, topKey, sinkKey, highDetail }) {
  const group = useRef()
  const finish = FINISHES[finishKey]
  const top = COUNTERTOPS[topKey]
  const sink = SINKS[sinkKey]

  const bodyGeo = useMemo(() => new THREE.BoxGeometry(inchesToMeters(w), inchesToMeters(h), inchesToMeters(d)), [w,h,d])
  const topGeo  = useMemo(() => new THREE.BoxGeometry(inchesToMeters(w+2), inchesToMeters(1.25), inchesToMeters(d+2)), [w,d])

  // Simple door/drawer face as inset plane (static for MVP)
  const faceGeo = useMemo(() => new THREE.BoxGeometry(inchesToMeters(w-2), inchesToMeters(h-4), inchesToMeters(0.6)), [w,h])

  // Sink shapes (very simplified) – vessel sphere, undermount hole, slab slight inset
  const vesselRef = useRef()
  useFrame((state, delta) => {
    if (vesselRef.current && sink.type === 'vessel') vesselRef.current.rotation.y += delta * 0.2
  })

  // Materials
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(finish.color),
    roughness: finish.roughness,
    metalness: finish.metalness
  }), [finish])

  const counterMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(top.color),
      roughness: top.roughness,
      metalness: top.metalness,
      envMapIntensity: highDetail ? 1.2 : 0.6
    })
    return m
  }, [top, highDetail])

  const faceMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#222831'),
    roughness: 0.9,
    metalness: 0.0
  }), [])

  // Simple boolean-ish look for undermount: render a darker rectangle “cutout”
  const cutoutGeo = useMemo(() => new THREE.BoxGeometry(inchesToMeters(16), inchesToMeters(7), inchesToMeters(0.8)), [])
  const cutoutMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a0c10', roughness: 0.5, metalness: 0.2 }), [])

  return (
    <group ref={group}>
      {/* Cabinet body */}
      <mesh geometry={bodyGeo} material={bodyMat} position={[0, inchesToMeters(h/2), 0]} castShadow receiveShadow />
      {/* Door/Drawer face */}
      <mesh geometry={faceGeo} material={faceMat} position={[0, inchesToMeters(h/2), inchesToMeters(d/2)+inchesToMeters(0.3)]} castShadow />
      {/* Countertop */}
      <mesh geometry={topGeo} material={counterMat} position={[0, inchesToMeters(h)+inchesToMeters(0.625), 0]} castShadow receiveShadow />
      {/* Sinks */}
      {sink.type === 'vessel' && (
        <mesh ref={vesselRef} position={[0, inchesToMeters(h)+inchesToMeters(1.6), inchesToMeters(0)]} castShadow receiveShadow>
          <sphereGeometry args={[inchesToMeters(6), 32, 32]} />
          <meshStandardMaterial color="#d8dde3" roughness={0.25} metalness={0.1} envMapIntensity={highDetail ? 1.4 : 0.8} />
        </mesh>
      )}
      {sink.type === 'under' && (
        <mesh geometry={cutoutGeo} material={cutoutMat} position={[0, inchesToMeters(h)+inchesToMeters(0.9), 0]} castShadow />
      )}
      {sink.type === 'slab' && (
        <mesh position={[0, inchesToMeters(h)+inchesToMeters(0.9), 0]}>
          <boxGeometry args={[inchesToMeters(18), inchesToMeters(0.4), inchesToMeters(12)]} />
          <meshStandardMaterial color="#cfd6dd" roughness={0.2} metalness={0.05} envMapIntensity={highDetail ? 1.2 : 0.6} />
        </mesh>
      )}
    </group>
  )
}

function Scene({ state }) {
  const { w, h, d, finish, top, sink, highDetail } = state
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [2.2, 1.4, 2.6], fov: 40 }}>
      <ambientLight intensity={highDetail ? 0.2 : 0.35} />
      <directionalLight position={[3, 5, 3]} intensity={highDetail ? 1.4 : 1.0} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <Environment preset={highDetail ? 'apartment' : 'city'} />
      <Vanity w={w} h={h} d={d} finishKey={finish} topKey={top} sinkKey={sink} highDetail={highDetail} />
      <ContactShadows opacity={0.4} blur={1.6} scale={8} position={[0, 0, 0]} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={1} maxDistance={8} />
    </Canvas>
  )
}

function App() {
  const [state, setState] = useLocalStorage('klg:cfg', {
    w: 48, h: 32, d: 21,
    finish: 'grey',
    top: 'quartz',
    sink: 'undermount',
    preset: 'single',
    highDetail: true
  })
  const [isFS, setIsFS] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900) // faux loading for nicer first impression
    return () => clearTimeout(t)
  }, [])

  const price = useMemo(() => {
    const base = 400 // base cabinet price
    const sizeMul = (state.w * state.h * state.d) / (48 * 32 * 21)
    const finishMul = ( { ...FINISHES }[state.finish] || { priceMul: 1 }).priceMul
    const topMul = ( { ...COUNTERTOPS }[state.top] || { priceMul: 1 }).priceMul
    const sinkMul = ( { ...SINKS }[state.sink] || { priceMul: 1 }).priceMul
    const result = base * sizeMul * finishMul * topMul * sinkMul
    return Math.max(150, Math.round(result / 10) * 10)
  }, [state])

  function setField(k, v) { setState(prev => ({ ...prev, [k]: v })) }

  function saveDesign() {
    localStorage.setItem('klg:saved', JSON.stringify(state))
    setToast('Design saved')
    setTimeout(()=>setToast(''), 1400)
  }
  function loadDesign() {
    const raw = localStorage.getItem('klg:saved')
    if (raw) { setState(JSON.parse(raw)); setToast('Design loaded'); setTimeout(()=>setToast(''), 1200) }
  }

  function snapshot() {
    const el = document.querySelector('canvas')
    if (!el) return
    const dataURL = el.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataURL
    a.download = `klg-vanity-${Date.now()}.png`
    a.click()
    setToast('Snapshot downloaded')
    setTimeout(()=>setToast(''), 1200)
  }

  function toggleFS() {
    const root = document.documentElement
    if (!document.fullscreenElement) { root.requestFullscreen(); setIsFS(true) }
    else { document.exitFullscreen(); setIsFS(false) }
  }

  function applyPreset(key) {
    const p = { single: { sink: 'undermount', w: 48 },
                double: { sink: 'undermount', w: 72 },
                drawer: { sink: 'slab', w: 48 } }[key] || {}
    setState(s => ({ ...s, preset: key, ...p }))
    setToast(`Preset: ${key} applied`)
    setTimeout(()=>setToast(''), 1000)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">KLG DESIGN</div>
        <div className="sub">3D Vanity Builder · Dark Theme</div>

        <div className="section">
          <h1>Dimensions (inches)</h1>
          <div className="row"><label>Width</label><input type="number" min="18" max="96" value={state.w} onChange={e=>setField('w', clamp(parseInt(e.target.value||0), 18, 96))} /></div>
          <div className="row"><label>Height</label><input type="number" min="28" max="40" value={state.h} onChange={e=>setField('h', clamp(parseInt(e.target.value||0), 28, 40))} /></div>
          <div className="row"><label>Depth</label><input type="number" min="16" max="26" value={state.d} onChange={e=>setField('d', clamp(parseInt(e.target.value||0), 16, 26))} /></div>
        </div>

        <div className="section">
          <h1>Styles</h1>
          <div className="row"><label>Finish</label>
            <select value={state.finish} onChange={e=>setField('finish', e.target.value)}>
              {Object.keys(FINISHES).map(k => <option key={k} value={k}>{FINISHES[k].name}</option>)}
            </select>
          </div>
          <div className="row"><label>Countertop</label>
            <select value={state.top} onChange={e=>setField('top', e.target.value)}>
              {Object.keys(COUNTERTOPS).map(k => <option key={k} value={k}>{COUNTERTOPS[k].name}</option>)}
            </select>
          </div>
          <div className="row"><label>Sink</label>
            <select value={state.sink} onChange={e=>setField('sink', e.target.value)}>
              {Object.keys(SINKS).map(k => <option key={k} value={k}>{SINKS[k].name}</option>)}
            </select>
          </div>
        </div>

        <div className="section">
          <h1>Presets</h1>
          <div className="grid-2">
            <button className="btn ghost" onClick={()=>applyPreset('single')}>Single</button>
            <button className="btn ghost" onClick={()=>applyPreset('double')}>Double</button>
            <button className="btn ghost" onClick={()=>applyPreset('drawer')}>Drawer Base</button>
            <button className="btn ghost" onClick={()=>{ setField('highDetail', !state.highDetail) }}>{state.highDetail ? 'Ultra ON' : 'Ultra OFF'}</button>
          </div>
        </div>

        <div className="section">
          <h1>Price</h1>
          <div className="price">${price.toLocaleString()}</div>
        </div>

        <div className="section grid-2">
          <button className="btn primary" onClick={saveDesign}>Save</button>
          <button className="btn" onClick={loadDesign}>Load</button>
          <button className="btn" onClick={snapshot}>Snapshot</button>
          <button className="btn" onClick={toggleFS}>Full Screen</button>
        </div>

        <div className="muted" style={{marginTop:12}}>MVP features only · Doors/Drawers are static for now.</div>
      </aside>
      <main className="canvas-wrap">
        <div className="topbar">
          <span className="badge">Dark Theme</span>
          <span className="badge">{state.highDetail ? 'Ultra' : 'Standard'}</span>
        </div>
        <Scene state={state} />
      </main>
      {toast && <div className="toast">{toast}</div>}
      {loading && (
        <div className="loading">
          <div>
            <div className="logo" style={{textAlign:'center'}}>KLG DESIGN</div>
            <div className="sub" style={{textAlign:'center'}}>Loading 3D assets…</div>
            <div className="spinner"></div>
          </div>
        </div>
      )}
    </div>
  )
}

function useLocalStorage(key, initial) {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch { return initial }
  })
  React.useEffect(() => { localStorage.setItem(key, JSON.stringify(state)) }, [key, state])
  return [state, setState]
}

export default App
