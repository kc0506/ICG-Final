
import * as THREE from 'three';
import { usePBDObject } from './hooks';
import * as Physics from './physics';


import { forwardRef, useImperativeHandle, useMemo } from 'react';
import JP from './assets/JP.png';
import NVIDIA from './assets/NVIDIA.png';
import ROC from './assets/ROC.png';
import { useUpdateShowWire } from './store';
import { useDraggable } from './useDraggable';
const ROCTexture = new THREE.TextureLoader().load(NVIDIA, undefined, undefined, console.log);

// const ROCTexture = new THREE.TextureLoader().load(JP);
ROCTexture.repeat.set(1, 1);
type Flag = 'ROC' | 'JP' | 'NVIDIA';
const flagMap: Record<Flag, string> = {
    ROC,
    JP,
    NVIDIA
};

type Props = {
    flag: Flag
} & Partial<Physics.ClothOptions>;
const Cloth = forwardRef<Physics.Cloth, Props>(function ({ flag, ...options }: Props, ref) {

    const texture = useMemo(() => {
        const t = new THREE.TextureLoader().load(flagMap[flag], undefined, undefined, console.log);
        // const ROCTexture = new THREE.TextureLoader().load(JP);
        t.repeat.set(1, 1);
        return t
    }, [flag]);

    const [cloth] = usePBDObject(
        Physics.Cloth,
        2.2,
        3.2,
        {
            spacing: 0.2,
            enableCollision: true,
            // initialEulers: [Math.PI / 2, 0, 0],
            // initialEulers: [0, Math.PI / 2, 0],
            initialPosition: [0, 3, 0],
            ...options,
        });

    useImperativeHandle(ref, () => {
        return cloth;
    });

    const bind = useDraggable({ id: cloth.id });
    const { wireframe } = useUpdateShowWire();

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
    return <group
        {...bind}
    >
        <mesh geometry={cloth.geometry} castShadow receiveShadow>
            {/* <meshPhongMaterial color={0xffff00} side={THREE.FrontSide} /> */}
            <meshPhongMaterial map={texture} side={THREE.FrontSide} wireframe={wireframe === 'wire'} />
        </mesh>
        <mesh geometry={cloth.geometry} receiveShadow>
            {/* <meshPhongMaterial color={0x00ff00} side={THREE.BackSide} /> */}
            <meshPhongMaterial map={texture} side={THREE.BackSide} wireframe={wireframe === 'wire'} />
        </mesh>
    </group >
});

export default Cloth;