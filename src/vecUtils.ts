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

export function vecAt(arr: Float32Array, id: number) {
    return arr.slice(id * 3, id * 3 + 3);
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
