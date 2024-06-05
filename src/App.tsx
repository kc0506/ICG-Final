import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import { useUpdateMode, useUpdateShowWire } from './store';


export default function App() {
  const {mode, changeMode } = useUpdateMode();
  const { wireframe, changeWire } = useUpdateShowWire();

  return (
    <>
      <div className=' z-0 fixed h-full w-full'>
        <Canvas shadows  >
          <color attach="background" args={['#333333']} />
          <Scene />
        </Canvas>
      </div>
      <div className='z-10 fixed top-0 right-0'>
        Manual Update
        <input type="checkbox" name="" checked={mode==='manual'} onChange={e => {
          const mode = e.target.checked ? 'manual' : 'auto';
          changeMode(mode)
          localStorage.setItem('mode', mode)
        }} id="" />
      </div>
      <div className='z-10 fixed top-5 right-0'>
        Show Framework
        <input type="checkbox" name="" checked={wireframe==='wire'} onChange={e => {
          const mode = e.target.checked ? 'wire' : 'body';
          changeWire(mode)
          localStorage.setItem('wireframe', mode)
        }} id="" />
      </div>
    </>
  )
}


