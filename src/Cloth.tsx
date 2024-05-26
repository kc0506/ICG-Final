
import { useMemo, useRef } from 'react'
import * as Physics from './physics'
import * as THREE from 'three'
import { useWorld } from './hooks';
import { useFrame } from '@react-three/fiber';

export default function Cloth() {

    const world = useWorld();

    const cloth = useMemo(() => {
        console.log('hi')
        const width = 0.5;
        const height = 3;
        const spacing = 0.1;
        const cloth = new Physics.Cloth(width, height, { spacing, enableCollision: true })
        world.add(cloth);
        return cloth;
    }, []);

    useFrame((state, dt) => {

    });
    const ref = useRef<THREE.Mesh>();


    return <group>
        <mesh geometry={cloth.geometry}>
            <meshPhongMaterial color={0xff0000} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={cloth.geometry}>
            <meshPhongMaterial color={0x00ff00} side={THREE.BackSide} />
        </mesh>
    </group>
}