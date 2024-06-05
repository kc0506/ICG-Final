
import * as THREE from 'three';
import { usePBDObject, useWorld } from './hooks';
import * as Physics from './physics';


import ROC from './assets/ROC.png';
import JP from './assets/JP.png';
import NVIDIA from './assets/NVIDIA.png';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useStore } from 'zustand';
import { useGlobalStore } from './store';
import { useEventListener } from 'usehooks-ts';
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

    const world = useWorld();

    const [cloth, remount] = usePBDObject(
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

    // TODO: PBD will not work if parent has transforms
    return <group
        {...bind}
    >
        <mesh geometry={cloth.geometry} castShadow receiveShadow>
            {/* <meshPhongMaterial color={0xffff00} side={THREE.FrontSide} /> */}
            <meshPhongMaterial map={texture} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={cloth.geometry} receiveShadow>
            {/* <meshPhongMaterial color={0x00ff00} side={THREE.BackSide} /> */}
            <meshPhongMaterial map={texture} side={THREE.BackSide} />
        </mesh>
    </group >
});

export default Cloth;