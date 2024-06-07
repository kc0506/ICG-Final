import { create } from "zustand";
import * as THREE from "three";
import { vecAt } from "./vecUtils";

const defaultMaxItems = 100;
const color = [1, 0, 1];
const minDist = 0.001;

function setAt(arr: Float32Array, i: number, x: number, y: number, z: number) {
    if (i === 0 || i === defaultMaxItems - 1) {
        if (i)
            i = 2 * (defaultMaxItems - 1) - 1;
        arr[3 * i] = x;
        arr[3 * i + 1] = y;
        arr[3 * i + 2] = z;
        return;
    }
    i = (1 + (i - 1) * 2);
    arr[3 * i] = x;
    arr[3 * i + 1] = y;
    arr[3 * i + 2] = z;
    i++
    arr[3 * i] = x;
    arr[3 * i + 1] = y;
    arr[3 * i + 2] = z;
}

export const useTrajectoryStore = create<{
    geometry: THREE.BufferGeometry;
    update: (point: THREE.Vector3) => void;
}>((set) => {
    const arrayLen = 2 * (defaultMaxItems - 1) * 3;
    const array = new Float32Array(arrayLen);
    const colorArray = new Float32Array(arrayLen);
    const alphaArray = new Float32Array((defaultMaxItems - 1) * 2);
    // for (let i = 1; i < defaultMaxItems; i++) {
    //     const ratio = (i / defaultMaxItems);
    //     // console.log(ratio)
    //     // setAt(colorArray, i, 0.5, 1 - ratio, 0)
    //     let a = vecAt(colorArray, 2 * (i - 1) + 1);
    //     a.set([0.5, 0, 0]);
    //     if (i < defaultMaxItems - 1) {
    //         a = vecAt(colorArray, 2 * (i - 1) + 2);
    //         a.set([0.5, 0, 0]);
    //     }
    // }
    // {
    //     const a = vecAt(colorArray, 0);
    //     a.set([1.0, 0, 0]);
    // }
    for (let i = 0; i < (defaultMaxItems - 1); i++) {
        const intensity = 1 - (i / (defaultMaxItems - 1)) ** 0.5;
        const curColor = color.map(x => x * intensity);
        vecAt(colorArray, 2 * i).set(curColor);
        vecAt(colorArray, 2 * i + 1).set(curColor);
        // colorArray[i] = color[0];
        // colorArray[i + 1] = color[1];
        // colorArray[i + 2] = color[2];
    }


    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(array, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colorArray, 3));
    geometry.setDrawRange(0, 0);
    let count = 0;

    function update(point: THREE.Vector3) {
        const position = geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let i = defaultMaxItems - 1; i > 1; i--)
            for (let j = 0; j < 3; j++)
                position.array[i * 3 + j] = position.array[(i - 2) * 3 + j];
        {
            const i = 1;
            for (let j = 0; j < 3; j++)
                position.array[i * 3 + j] = position.array[(i - 1) * 3 + j];
        }

        position.array[0] = point.x;
        position.array[1] = point.y;
        position.array[2] = point.z;

        if (count < defaultMaxItems) {
            count++;
            geometry.setDrawRange(0, count);
        }
        position.needsUpdate = true;
    }

    return { geometry, update };
})
