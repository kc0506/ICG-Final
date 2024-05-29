/**
 * @module vecUtils
 * @description
 * Utils for vector operations on Float32Array. Assume steps of 3.
 */

import { ReactThreeFiber } from "@react-three/fiber";
import * as THREE from "three";

type Vec3 = THREE.Vector3 | number[] | Float32Array;

function toArray(v: Vec3): Float32Array | number[] {
    if (v instanceof THREE.Vector3) return v.toArray();
    if (v.length !== 3) throw new Error(`Invalid vector length: ${v.length}`);
    return v;
}

export function vecIsValid(arr: Float32Array, id: number) {
    return id * 3 < arr.length;
}

export function vecAt(arr: Float32Array, id: number) {
    // this line will create new array 
    // fix it so that it returns a view
    return arr.subarray(id * 3, id * 3 + 3);
}

export function vecCopy(out: Float32Array, id: number, v: Vec3) {
    v = toArray(v);
    out.set(v, 3 * id);
}

export function vecSet(out: Float32Array, id: number, x: number, y: number, z: number) {
    out.set([x, y, z], 3 * id);
}

export function vecAdd(out: Float32Array, id: number, v: Vec3, scale: number = 1) {
    v = toArray(v);
    // console.log('v',v);
    for (let i = 0; i < 3; i++) out[id * 3 + i] += v[i] * scale;
}

export function vecSetSum(out: Float32Array, id: number, a: Vec3, b: Vec3) {
    a = toArray(a);
    b = toArray(b);
    for (let i = 0; i < 3; i++) out[id * 3 + i] = a[i] + b[i];
}

export function vecSub(out: Float32Array, id: number, v: Vec3, scale: number = 1) {
    v = toArray(v);
    for (let i = 0; i < 3; i++) out[id * 3 + i] -= v[i] * scale;
}

export function vecSetDiff(out: Float32Array, id: number, a: Vec3, b: Vec3) {
    a = toArray(a);
    b = toArray(b);
    for (let i = 0; i < 3; i++) out[id * 3 + i] = a[i] - b[i];
}

export function vecScale(out: Float32Array, id: number, scale: number) {
    for (let i = 0; i < 3; i++) out[id * 3 + i] *= scale;
}

export function vecLengthSquared(v: Float32Array, id: number) {
    v = vecAt(v, id);
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

export function vecSetCross(out: Float32Array, id: number, a: Vec3, b: Vec3) {
    a = toArray(a);
    b = toArray(b);
    out[id * 3] = a[1] * b[2] - a[2] * b[1];
    out[id * 3 + 1] = a[2] * b[0] - a[0] * b[2];
    out[id * 3 + 2] = a[0] * b[1] - a[1] * b[0];
}

export function vecSetDot(a: Vec3, b: Vec3): number {
    a = toArray(a);
    b = toArray(b);
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
} 

export function vecDistSquared(a: Vec3, b: Vec3): number {
    a = toArray(a);
    b = toArray(b);
    let sum = 0;
    for (let i = 0; i < 3; i++) sum += (a[i] - b[i]) ** 2;
    return sum;
}

export function getTetVolume(id: number, tetIds: number[], positionArray: Float32Array): number {
    const temp = new Float32Array(4 * 3);
    var id0 = tetIds[4 * id];
    var id1 = tetIds[4 * id + 1];
    var id2 = tetIds[4 * id + 2];
    var id3 = tetIds[4 * id + 3];
    vecSetDiff(temp,0, vecAt(positionArray, id1), vecAt(positionArray, id0));
    vecSetDiff(temp,1, vecAt(positionArray, id2), vecAt(positionArray, id0));
    vecSetDiff(temp,2, vecAt(positionArray, id3), vecAt(positionArray, id0));

    vecSetCross(temp,3, vecAt(temp, 0), vecAt(temp, 1));
    return vecSetDot(vecAt(temp, 3), vecAt(temp, 2)) / 6.0;
}