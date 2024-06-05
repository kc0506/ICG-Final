import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import { useGlobalStore } from './store';
import { Perf } from 'r3f-perf';
import { useWorld } from './hooks';


export default function App() {
  const { isHover, mode, changeMode } = useGlobalStore();

  const world = useWorld();
  return (
    <>
      <div className={` z-0 fixed h-full w-full ${isHover && 'cursor-pointer'}`}
        onPointerUp={e => world.endDrag()}
      >
        <Canvas shadows  >
          <color attach="background" args={['#333333']} />
          <Scene />
          <Perf />
        </Canvas>
      </div>
      <div className='z-10 fixed top-0 right-0'>
        Manual Update
        <input type="checkbox" name="" checked={mode === 'manual'} onChange={e => {
          const mode = e.target.checked ? 'manual' : 'auto';
          changeMode(mode)
          localStorage.setItem('mode', mode)
        }} id="" />
      </div>
    </>
  )
}


