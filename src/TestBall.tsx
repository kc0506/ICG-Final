import { useFrame } from "@react-three/fiber";
import { usePBDObject } from "./hooks";
import { TestBall } from "./physics/test";
import { useRef } from "react";


import * as THREE from "three";

export function Test() {
    const radius = 0.25;
    const [ball] = usePBDObject(TestBall, [0, 1, 0])

    const ref1 = useRef<THREE.Mesh>(null!);
    const ref2 = useRef<THREE.Mesh>(null!);
    useFrame(() => {
        const [x1, y1, z1, x2, y2, z2] = ball.positionArray
        ref1.current?.position.set(x1, y1 + radius, z1)
        ref2.current?.position.set(x2, y2 + radius, z2)
    });


    return <>
        <mesh ref={ref1}>
            <sphereGeometry args={[radius]} />
            <meshStandardMaterial color="red" />
        </mesh>
        <mesh ref={ref2}>
            <sphereGeometry args={[radius]} />
            <meshStandardMaterial color="red" />
        </mesh>
    </>
}