import { useFrame } from "@react-three/fiber";
import { usePBDObject } from "./hooks";
import { Pendulum } from "./physics/pendulum";
import { useUpdateShowWire } from "./store";

import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";

type Props = {
    pos: number[];
    mass: number[];
    length: number[];
    color: string;
    dir: number;
};


const TriplePendulum = forwardRef<Pendulum, Props>(function ({ pos, mass, length, color, dir }: Props, ref) {
    const { wireframe } = useUpdateShowWire();

    const masses = mass;
    const lengths = length;
    const angles = [Math.PI / 2, Math.PI, Math.PI];
    const pinPos = pos;

    const radius = 0.1;
    const radii = [0.1 * masses[0], 0.1 * masses[1], 0.1 * masses[2]];
    const linkRadius = 0.9
    const [triplePendulum] = usePBDObject(
        Pendulum,
        masses,
        lengths,
        angles,
        pinPos,
        dir
    );

    useImperativeHandle(ref, () => {
        return triplePendulum;
    });

    const pinRef = useRef<THREE.Mesh>(null!);
    const pinBallRef = useRef<THREE.Mesh>(null!);
    const ballRefs = useMemo(() => radii.map(() => React.createRef<THREE.Mesh>()), [radii.length]);
    const cylinderRefs = useMemo(() => radii.map(() => React.createRef<THREE.Mesh>()), [radii.length]);

    // trail geomerty
    const trailLength = 1000;
    const trailGeometry = useMemo(() => new THREE.BufferGeometry(), []);
    const trailMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: color }), [color]);
    const trailPoints = useMemo(() => new Float32Array(trailLength * 3), []);
    const tailIndex = (masses.length * 3);
    let currentTaillength = 0;
    // for (let i = 0; i < trailLength; i++) {
    //     trailPoints[i * 3] = triplePendulum.positionArray[0];
    //     trailPoints[i * 3 + 1] = triplePendulum.positionArray[1];
    //     trailPoints[i * 3 + 2] = triplePendulum.positionArray[2];
    // }

    useFrame(() => {
        pinRef.current?.position.set(triplePendulum.positionArray[0], triplePendulum.positionArray[1], triplePendulum.positionArray[2]);
        const startPos = new THREE.Vector3(triplePendulum.positionArray[0], triplePendulum.positionArray[1], triplePendulum.positionArray[2]);
        const endPos = new THREE.Vector3(triplePendulum.positionArray[3], triplePendulum.positionArray[4], triplePendulum.positionArray[5]);
        const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        const length = startPos.distanceTo(endPos);
        pinBallRef.current?.position.copy(midpoint);
        pinBallRef.current?.scale.set(linkRadius, length, linkRadius); // Scale cylinder to correct length
        pinBallRef.current?.lookAt(endPos);
        pinBallRef.current?.rotateX(Math.PI / 2); // Align with ends

        ballRefs.forEach((ref, index) => {
            const baseIndex = (index + 1) * 3;
            const x = triplePendulum.positionArray[baseIndex];
            const y = triplePendulum.positionArray[baseIndex + 1];
            const z = triplePendulum.positionArray[baseIndex + 2];
            if (ref.current) {
                ref.current.position.set(x, y, z);
            }

            if (index > 0 && cylinderRefs[index].current) {
                const prevBall = ballRefs[index - 1].current;
                // const currentBall = ref.current;
                const startPos = new THREE.Vector3().copy(prevBall.position);
                const endPos = new THREE.Vector3(x, y, z);
                const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
                const length = startPos.distanceTo(endPos);

                cylinderRefs[index].current.position.copy(midpoint);
                cylinderRefs[index].current.scale.set(linkRadius, length, linkRadius); // Scale cylinder to correct length
                cylinderRefs[index].current.lookAt(endPos);
                cylinderRefs[index].current.rotateX(Math.PI / 2); // Align with ends
            }
        });

        // update trail
        currentTaillength = Math.min(currentTaillength + 1, trailLength);
        let i = 0
        for (i = 0; i < trailLength - 1; i++) {
            trailPoints[i * 3] = trailPoints[(i + 1) * 3];
            trailPoints[i * 3 + 1] = trailPoints[(i + 1) * 3 + 1];
            trailPoints[i * 3 + 2] = trailPoints[(i + 1) * 3 + 2];
        }
        trailPoints[i * 3] = triplePendulum.positionArray[tailIndex];
        trailPoints[i * 3 + 1] = triplePendulum.positionArray[tailIndex + 1];
        trailPoints[i * 3 + 2] = triplePendulum.positionArray[tailIndex + 2];

        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPoints, 3));
        trailGeometry.setDrawRange(trailLength - currentTaillength, trailLength); // 只绘制有效的点
    });

    return (
        <>
            <mesh ref={pinRef}>
                <sphereGeometry args={[radius, 5, 5]} />
                <meshStandardMaterial color="blue" wireframe={wireframe === 'wire'} />
            </mesh>
            <mesh ref={pinBallRef}>
                <cylinderGeometry args={[0.02, 0.02, 1, 32]} />
                <meshStandardMaterial color="green" wireframe={wireframe === 'wire'} />
            </mesh>
            {radii.map((radius, index) => (
                <mesh key={index} ref={ballRefs[index]}>
                    <sphereGeometry args={[radius, 10, 10]} />
                    <meshStandardMaterial color={color} wireframe={wireframe === 'wire'} />
                </mesh>
            ))}
            {radii.slice(1).map((_, index) => (
                <mesh key={index} ref={cylinderRefs[index + 1]}>
                    <cylinderGeometry args={[0.02, 0.02, 1, 32]} />
                    <meshStandardMaterial color="green" />
                </mesh>
            ))}
            {/* 轨迹线 */}
            <line geometry={trailGeometry} material={trailMaterial} />
        </>
    );
});

export default TriplePendulum;
