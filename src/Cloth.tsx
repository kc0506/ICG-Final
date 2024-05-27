
import * as THREE from 'three';
import { usePBDObject, useWorld } from './hooks';
import * as Physics from './physics';


import ROC from './assets/ROC.png';
import JP from './assets/JP.png';
import { forwardRef, useImperativeHandle } from 'react';
const ROCTexture = new THREE.TextureLoader().load(ROC);
// const ROCTexture = new THREE.TextureLoader().load(JP);
ROCTexture.repeat.set(1, 1);

const Cloth = forwardRef<Physics.Cloth>(function ({ }, ref) {

    const world = useWorld();

    const [cloth, remount] = usePBDObject(Physics.Cloth, 3.2, 2.1, { spacing: 0.1, enableCollision: true });

    useImperativeHandle(ref, () => {
        return cloth;
    });

    // const cloth = useMemo(() => {
    //     console.log('hi')
    //     const width = 0.5;
    //     const height = 3;
    //     const spacing = 0.1;
    //     const cloth = new Physics.Cloth(width, height, { spacing, enableCollision: true })
    //     world.add(cloth);
    //     return cloth;
    // }, []);



    // TODO: PBD will not work if parent has transforms
    return <group onClick={() => remount()}>
        <mesh geometry={cloth.geometry} >
            {/* <meshPhongMaterial color={0xffff00} side={THREE.FrontSide} /> */}
            <meshBasicMaterial map={ROCTexture} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={cloth.geometry}>
            {/* <meshPhongMaterial color={0x00ff00} side={THREE.BackSide} /> */}
            <meshBasicMaterial map={ROCTexture} side={THREE.BackSide} />
        </mesh>
    </group>
});

export default Cloth;