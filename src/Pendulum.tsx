import { useFrame } from "@react-three/fiber";
import { usePBDObject } from "./hooks";
import { Pendulum } from "./physics/pendulum";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import React from "react";
import * as THREE from "three";

const TriplePendulum = forwardRef<Pendulum>(function ({ }, ref) {
    const masses = [1.0, 2.5, 1.5];
    const lengths = [2, 1.5, 1];
    const angles = [Math.PI/2, Math.PI, Math.PI];
    const pinPos = [0.0, 5.0, 0.0];

    const radius = 0.1;
    // const radii = [0.5 * masses[0], 0.5 * masses[1], 0.5 * masses[2]];
    const radii = [0.1*masses[0], 0.1*masses[1], 0.1*masses[2]];
    const linkRadius = 0.9
    const [triplePendulum] = usePBDObject(
        Pendulum, 
        masses, 
        lengths,
        angles,
        pinPos
    );

    useImperativeHandle(ref, () => {
        return triplePendulum;
    });

    const pinRef = useRef<THREE.Mesh>(null!);
    const pinBallRef = useRef<THREE.Mesh>(null!);
    const ballRefs = useMemo(() => radii.map(() => React.createRef<THREE.Mesh>()), [radii.length]);
    const cylinderRefs = useMemo(() => radii.map(() => React.createRef<THREE.Mesh>()), [radii.length]);

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
                const currentBall = ref.current;
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
    });

    return (
        <>
            <mesh ref={pinRef}>
                <sphereGeometry args={[radius]} />
                <meshStandardMaterial color="blue" />
            </mesh>
            <mesh ref={pinBallRef}>
                <cylinderGeometry args={[0.02, 0.02, 1, 32]} />
                <meshStandardMaterial color="green" />
            </mesh>
            {radii.map((radius, index) => (
                <mesh key={index} ref={ballRefs[index]}>
                    <sphereGeometry args={[radius, 32, 32]} />
                    <meshStandardMaterial color="red" />
                </mesh>
            ))}
            {radii.slice(1).map((_, index) => (
                <mesh key={index} ref={cylinderRefs[index + 1]}>
                    <cylinderGeometry args={[0.02, 0.02, 1, 32]} />
                    <meshStandardMaterial color="green" />
                </mesh>
            ))}
        </>
    );
});

export default TriplePendulum;
