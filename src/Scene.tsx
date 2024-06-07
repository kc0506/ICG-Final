import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useEventListener } from 'usehooks-ts';
import Cloth from './Cloth';
import { useWorld } from './hooks';
import * as Physics from './physics';
import { useGlobalStore } from './store';
import { assertionFail } from './utils';


function Ground() {
  return <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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



const gravity = new THREE.Vector3(0.00, -2.9, 0);
// const gravity = new THREE.Vector3(0.00, 0, 0);
// document.addEventListener('keypress', (e) => {
//   console.log(e)
// })

import { vecAt } from './vecUtils';
import SoftBody from './SoftBody';


let hasSetConstraint = false;

let t = 0;
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

  const cloth = useRef<Physics.Cloth>(null!);
  const bunny1 = useRef<Physics.SoftBody>(null!);
  const bunny2 = useRef<Physics.SoftBody>(null!);
  const triplePendulum = useRef<Physics.Pendulum>(null!);

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
    // if (hasSetConstraint) return;
    if (!bunny1.current || !bunny2.current) return;

    const constraint = new Physics.DistanceConstraintMulti(2, world.objects);
    const id1 = Math.floor(Math.random() * bunny1.current.numParticles);
    const id2 = Math.floor(Math.random() * bunny2.current.numParticles);
    constraint.addConstraint(bunny1.current.id, id1, bunny2.current.id, id2);
    world.addConstraint(constraint);

    // bunny1.current.addConstraint(constraint);
    // bunny2.current.addConstraint(constraint);

  }, [bunny1.current?.id, bunny2.current?.id])

  useEventListener('keypress', (e) => {
    if (e.key === 'r') {
      cloth.current?.reset();
      triplePendulum.current?.reset();
      bunny1.current?.reset();
    }
  })

  const { camera } = useThree();
  const { isHover } = useGlobalStore()

  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    ref.current?.position?.copy(Physics.curPosition);

    if (!cloth.current) return;
    const idLT = 0, idLB = cloth.current.numY - 1, idRT = cloth.current.numX * cloth.current.numY - 1, idRB = cloth.current.numX * cloth.current.numY - cloth.current.numY;
    cloth.current.invMass[idLT] = 0;
    cloth.current.invMass[idLB] = 0;
  })


  const routes = {
    '/flags': <Flags />,
  }[window.location.pathname];

  return <>
    {/* <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[0.3]} />
      <meshBasicMaterial color={0xff0000} />
    </mesh> */}
    {/* <gridHelper args={[20, 20]} position={[0, -2, 0]} /> */}
    <PerspectiveCamera makeDefault position={[0, 0, 10]} />
    {!isHover && < OrbitControls />}
    <Lights />
    <Ground />

    {false && < mesh position={[5, 5, 0]}>
      <boxGeometry args={[5, 3, 1]} />
      <meshPhongMaterial color={0xff0000} />
    </mesh>}

    {/* <Cloth ref={cloth} /> */}
    <SoftBody />
    {/* <Test /> */}
    {/* <TriplePendulum ref={triplePendulum} /> */}
    {/* <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors />
    </lineSegments> */}
  </>
}
const curPendulumPos = new THREE.Vector3();



// let t=0;
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