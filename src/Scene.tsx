import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useEventListener } from 'usehooks-ts';
import Cloth from './Cloth';
import { useWorld } from './hooks';
import * as Physics from './physics';
import { useGlobalStore } from './store';
import { assertionFail } from './utils';


function Ground() {
  return <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[20, 20]} />
    <meshPhongMaterial {... { color: 0xa0adaf, shininess: 150 }} />
  </mesh>

}

function Lights() {
  // const ref = useRef(null!);
  // useHelper(ref, THREE.PointLightHelper, 0.5, 'pink')

  return <>
    <ambientLight color={0x505050} intensity={5} />
    <spotLight
      intensity={15}
      color={0xffffff}
      angle={Math.PI / 5}
      penumbra={0.2}
      position={[2, 3, 3]}
      castShadow
      shadow-camera-near={3}
      shadow-camera-far={10}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />

    <directionalLight
      color={0x55505a}
      intensity={5}
      position={[0, 3, 0]}
      castShadow
      shadow-camera-near={1}
      shadow-camera-far={10}
      shadow-camera-right={1}
      shadow-camera-left={-1}
      shadow-camera-top={1}
      shadow-camera-bottom={-1}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
    {/* <pointLight ref={ref} position={[5, 5, 10]} intensity={100} color={0xffffff} /> */}
  </>
}



const gravity = new THREE.Vector3(0.00, -2.9, 0);
if (location.pathname === '/pendulum') {
  gravity.set(0, -9.8, 0);
}
// const gravity = new THREE.Vector3(0.00, 0, 0);
// document.addEventListener('keypress', (e) => {
//   console.log(e)
// })

import { vecAt } from './vecUtils';
import SoftBody from './SoftBody';
import TriplePendulum from './Pendulum';
import { OrbitControls as THREEOrbitControls } from 'three/examples/jsm/Addons.js';


let hasSetConstraint = false;

export let t = 0;
let hasPrint = false;
export default function Scene() {
  const world = useWorld();
  const [paused, setPaused] = useState(false);
  useEventListener('blur', () => setPaused(true))
  useEventListener('focus', () => setPaused(false))

  const { mode, changeMode } = useGlobalStore();

  // const { geometry, update } = useTrajectoryStore();

  const { size } = useThree();
  useEventListener('mousemove', (e) => {
    world.updateMouse(
      camera,
      (e.clientX / size.width) * 2 - 1,
      -(e.clientY / size.height) * 2 + 1,
    )
  })


  useFrame((state, dt) => {
    t += dt;

    if (!assertionFail && !paused && mode === 'auto') {
      world.update(dt, gravity);
    }
    else if (!hasPrint) {
      // ? Stop updating when assertion fails
    }
  });


  useEventListener('keydown', (e) => {
    if (e.key === 'n' && mode === 'manual') {
      world.update(1 / 60, gravity);
    } else if (e.key === ' ') {
      setPaused(p => !p);
      changeMode(mode === 'auto' ? 'manual' : 'auto');
    }
  })

  const { camera } = useThree();
  const { isHover } = useGlobalStore()


  const routes = {
    '/': <Basic />,
    '/flags': <Flags />,
    '/bunnies': <Bunnys />,
    '/pendulums': <PedunlumScene />,
  }[window.location.pathname];

  const orbitControlRef = useRef<THREEOrbitControls>(null);
  useFrame(() => {
    if (!orbitControlRef.current) return;
    orbitControlRef.current.enabled = !isHover && !world.isDragging;
  })

  return <>
    <PerspectiveCamera makeDefault position={[0, 0, 10]} />
    < OrbitControls ref={orbitControlRef} />
    <Lights />
    <Ground />

    {routes}
  </>
}

const curPendulumPos = new THREE.Vector3();

function Basic() {

  const cloth = useRef<Physics.Cloth>(null!);
  const bunny1 = useRef<Physics.SoftBody>(null!);

  return <>
    <SoftBody ref={bunny1} scale={1.5} />
    {/* <SoftBody scale={1.75} initialPosition={new THREE.Vector3(0, 3, 0)} /> */}
    {/* <Cloth ref={cloth} flag='NVIDIA' scale={2} /> */}
    <Cloth flag='ROC' scale={1} initialPosition={[0, 0, 2]} />
  </>
}

function Bunnys() {

  const world = useWorld();

  const bunny1 = useRef<Physics.SoftBody>(null!);
  const bunny2 = useRef<Physics.SoftBody>(null!);

  const idRef1 = useRef(0);
  const idRef2 = useRef(0);
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)]);
  }, []);
  useFrame(() => {
    if (!bunny1.current || !bunny2.current) return;

    const pos1 = vecAt(bunny1.current.positionArray, idRef1.current);
    const pos2 = vecAt(bunny2.current.positionArray, idRef2.current);
    const position = geometry.getAttribute('position');
    position.setXYZ(0, pos1[0], pos1[1], pos1[2]);
    position.setXYZ(1, pos2[0], pos2[1], pos2[2]);
    position.needsUpdate = true;

  });

  useEffect(() => {
    if (!bunny1.current || !bunny2.current) return;

    const constraint = new Physics.DistanceConstraintMulti(2, world.objects);
    const id1 = Math.floor(Math.random() * bunny1.current.numParticles);
    const id2 = Math.floor(Math.random() * bunny2.current.numParticles);
    constraint.addConstraint(bunny1.current.id, id1, bunny2.current.id, id2);
    world.addConstraint(constraint);
  }, [bunny1.current?.id, bunny2.current?.id])

  return <>
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={0xff00ff} />
    </lineSegments>
    <SoftBody ref={bunny1} scale={1.5} />
    <SoftBody ref={bunny2} initialPosition={new THREE.Vector3(1, 1, 1)} />
  </>
}

function Flags() {

  useFrame(() => {
    gravity.set(1.5 * Math.sin(t), -2.9, 0);
  })

  const cloth1 = useRef<Physics.Cloth>(null!);
  const cloth2 = useRef<Physics.Cloth>(null!);
  const cloth3 = useRef<Physics.Cloth>(null!);

  function getCorners(cloth: Physics.Cloth) {
    const idLT = 0, idLB = cloth.numY - 1, idRT = cloth.numX * cloth.numY - 1, idRB = cloth.numX * cloth.numY - cloth.numY;
    return [idLT, idLB, idRT, idRB] as const;
  }

  useFrame(() => {
    if (!cloth1.current) return;
    const [idLT, idLB, idRT, idRB] = getCorners(cloth1.current);
    cloth1.current.invMass[idLT] = 0;
    cloth1.current.invMass[idLB] = 0;
  })

  useFrame(() => {
    if (!cloth2.current) return;
    const [idLT, idLB, idRT, idRB] = getCorners(cloth2.current);
    cloth2.current.invMass[idLT] = 0;
    cloth2.current.invMass[idLB] = 0;
    cloth2.current.invMass[idRT] = 0;
    cloth2.current.invMass[idRB] = 0;
  })

  useFrame(() => {
    if (!cloth3.current) return;
    const [idLT, idLB, idRT, idRB] = getCorners(cloth3.current);
    cloth3.current.invMass[idLT] = 0;
    cloth3.current.invMass[idRT] = 0;
  })

  return <>
    <Cloth ref={cloth1} flag='NVIDIA'
      initialPosition={[-2, 3, 0]}
    />
    <Cloth ref={cloth2} flag='JP'

    />
    <Cloth ref={cloth3} flag='ROC'
      initialPosition={[4, 3, 0]}
      initialEulers={[0, Math.PI / 2, 0]}
    />
  </>

}

function PedunlumScene() {

  const pendulumsRef = useRef<React.RefObject<Physics.Pendulum>[]>([
    React.createRef<Physics.Pendulum>(),
    React.createRef<Physics.Pendulum>(),
    React.createRef<Physics.Pendulum>()
  ]);
  useEventListener('keypress', (e) => {
    if (e.key === 'r') {
      pendulumsRef.current?.forEach(p => p.current?.reset());
    }
  })

  const c = new THREE.Color("#999999");


  useFrame(() => {
    let s = Math.sin(t);
    console.log(s)
    s = 0;
    r = (new THREE.Color("#FF5151").multiplyScalar(0))
    r.copy(y)
    // console.log(r)
    //  b = new THREE.Color("#00E3E3")
    //  y = new THREE.Color("#FFFF37")
  });


  return <>
    <TriplePendulum ref={pendulumsRef.current[0]} pos={[2, 2.5, 0.0]} mass={[1.0, 2.0, 1.5]} length={[0.5, 1, 0.7]} color={r as any} dir={0} />
    <TriplePendulum ref={pendulumsRef.current[1]} pos={[0, 2.5, 0.0]} mass={[1.0, 0.7, 0.5]} length={[1, 0.5, 0.7]} color={b as any} dir={2} />
    <TriplePendulum ref={pendulumsRef.current[2]} pos={[-2, 2.5, 0.0]} mass={[0.7, 1.5, 2]} length={[0.8, 0.7, 0.6]} color={y as any} dir={0} />
  </>
}


let r = new THREE.Color("#FF5151");
let b = new THREE.Color("#00E3E3")
let y = new THREE.Color("#FFFF37")