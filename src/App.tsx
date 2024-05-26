import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Cloth from './Cloth';
import { useWorld } from './hooks';
import { assertionFail } from './utils';
import { vecAt } from './vecUtils';
import SoftBody from './SoftBody';

export default function App() {
  return (
    <Canvas >
      <Scene />
    </Canvas>
  )
}

let hasPrint = false;
function Scene() {
  const world = useWorld();

  useFrame((state, dt) => {
    if (!assertionFail) {
      world.update(dt, new THREE.Vector3(0, -1, 0));
      const objs = [...world.objects]
      if (objs.length === 0) return;
      console.log(vecAt(objs[0].positionArray, 0))
    }
    else if (!hasPrint) {
      // ? Stop updating when assertion fails
      hasPrint = true;
      // console.log(world.objects[0].positionArray)
      // console.log(world.objects[0].prevPositionArray)
      // console.log(world.objects[0].velocityArray)
    }
  });

  return <>
    <PerspectiveCamera makeDefault position={[0, 0, 10]} />
    <OrbitControls />
    <Lights />
    <Ground />

    {false && < mesh position={[5, 5, 0]}>
      <boxGeometry args={[5, 3, 1]} />
      <meshPhongMaterial color={0xff0000} />
    </mesh>}

    <Cloth />
    <SoftBody />
  </>
}

function Ground() {
  return <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

