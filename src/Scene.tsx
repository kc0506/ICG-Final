import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useEventListener } from 'usehooks-ts';
import { useWorld } from './hooks';
import { assertionFail } from './utils';
import { Test } from './TestBall';
import { useUpdateMode } from './store';
import Cloth from './Cloth';
import TriplePendulum from './Pendulum';


function Ground() {
  return <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
      intensity={10}
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
      intensity={1}
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


const gravity = new THREE.Vector3(0.00, -2.5, 0);
// document.addEventListener('keypress', (e) => {
//   console.log(e)
// })

import * as Physics from './physics';
import SoftBody from './SoftBody';

let hasPrint = false;
export default function Scene() {
  const world = useWorld();
  const [paused, setPaused] = useState(false);
  useEventListener('blur', () => setPaused(true))
  useEventListener('focus', () => setPaused(false))

  const { mode, changeMode } = useUpdateMode();

  useFrame((state, dt) => {
    if (!assertionFail && !paused && mode === 'auto') {
      world.update(dt, gravity);
      // const objs = [...world.objects]
      // if (objs.length === 0) return;
      // console.log(vecAt(objs[0].positionArray, 0))
    }
    else if (!hasPrint) {
      // ? Stop updating when assertion fails
      hasPrint = true;
      // console.log(world.objects[0].positionArray)
      // console.log(world.objects[0].prevPositionArray)
      // console.log(world.objects[0].velocityArray)
    }
  });


  useEventListener('keydown', (e) => {
    if (e.key === 'n' && mode === 'manual') {
      // console.log(e)
      world.update(1 / 60, gravity);
    } else if (e.key === ' ') {
      setPaused(p => !p);
      changeMode(mode === 'auto' ? 'manual' : 'auto');
    }
  })

  const cloth = useRef<Physics.Cloth>(null!);
  useEventListener('keypress', (e) => {
    if (e.key === 'r') {
      cloth.current.reset();
    }
  })

  const bunny = useRef<Physics.SoftBody>(null!);
  useEventListener('keypress', (e) => {
    if (e.key === 'r') {
      bunny.current.reset();
    }
  })

  const triplePendulum = useRef<Physics.Pendulum>(null!);
  useEventListener('keypress', (e) => {
    if (e.key === 'r') {
      triplePendulum.current.reset();
    }
  })

  return <>
    <PerspectiveCamera makeDefault position={[0, 0, 10]} />
    <OrbitControls />
    <Lights />
    <Ground />

    {false && < mesh position={[5, 5, 0]}>
      <boxGeometry args={[5, 3, 1]} />
      <meshPhongMaterial color={0xff0000} />
    </mesh>}

    {/* <Cloth ref={cloth} /> */}
    {/* <SoftBody ref={bunny} /> */}
    {/* <Test /> */}
    <TriplePendulum ref={triplePendulum} />
  </>
}