import { PDB } from "three/examples/jsm/Addons.js";
import { assert } from "../utils";
import { vecAdd, vecAt, vecIsValid, vecLengthSquared, vecScale, vecSetDiff, vecSetCross, getTetVolume } from "../vecUtils";
import { PBDObject } from "./PBDObject";

export abstract class Constraint {
    abstract solve(dt: number): void
}


type DistanceConstraintOptions = {
    initialPositions?: Float32Array,
    compliance?: number,
}

export class DistanceConstraint extends Constraint {
    #vecs = new Float32Array(2 * 3);

    invMass: Float32Array;
    positionArray: Float32Array
    initialPositions: Float32Array;


    #numConstraints = 0;
    ids: Uint32Array;
    restLens: Float32Array;
    compliance: number;

    constructor(
        maxNumConstraints: number,
        invMass: Float32Array,
        positionArray: Float32Array,
        options: DistanceConstraintOptions = {},
    ) {

        let {
            initialPositions,
            compliance = 0.0,
        } = options;

        super();
        this.invMass = invMass;
        this.positionArray = positionArray;
        if (!initialPositions)
            initialPositions = positionArray.slice();

        this.initialPositions = initialPositions;

        this.ids = new Uint32Array(maxNumConstraints * 2).fill(-1);
        this.restLens = new Float32Array(maxNumConstraints).fill(-1);
        this.compliance = compliance;

        // console.log(positionArray.length)
    }

    addConstraint(id0: number, id1: number) {
        if (!vecIsValid(this.positionArray, id0) || !vecIsValid(this.positionArray, id1)) {
            return;
        }

        if (this.#numConstraints >= this.ids.length / 2) {
            throw new Error("Constraint array is full");
        }

        this.ids[this.#numConstraints * 2] = id0;
        this.ids[this.#numConstraints * 2 + 1] = id1;

        const pos1 = vecAt(this.initialPositions, id0);
        const pos2 = vecAt(this.initialPositions, id1);
        vecSetDiff(this.#vecs, 0, pos1, pos2);
        this.restLens[this.#numConstraints] = Math.sqrt(vecLengthSquared(this.#vecs, 0));

        this.#numConstraints++;
    }


    suffle() {
        for (let i = 0; i < this.numConstraints; i++) {
            const j = Math.floor(Math.random() * this.#numConstraints);
            let temp;
            temp = this.ids[i * 2], this.ids[i * 2] = this.ids[j * 2], this.ids[j * 2] = temp;
            temp = this.ids[i * 2 + 1], this.ids[i * 2 + 1] = this.ids[j * 2 + 1], this.ids[j * 2 + 1] = temp;
            temp = this.restLens[i], this.restLens[i] = this.restLens[j], this.restLens[j] = temp;
        }
    }

    get numConstraints() {
        return this.#numConstraints;
    }

    solve(dt: number): void {
        for (var i = 0; i < this.numConstraints; i++) {
            const id0 = this.ids[2 * i];
            const id1 = this.ids[2 * i + 1];
            if (id0 === -1 || id1 === -1) continue;

            const w0 = this.invMass[id0];
            const w1 = this.invMass[id1];
            const w = w0 + w1;
            if (w == 0.0)
                continue;

            const diff = vecAt(this.#vecs, 0);
            vecSetDiff(diff, 0, vecAt(this.positionArray, id0), vecAt(this.positionArray, id1));
            const len = Math.sqrt(vecLengthSquared(diff, 0));
            if (len == 0.0)
                continue;

            const restLen = this.restLens[i];
            assert(Math.abs(restLen - 0.1) < 1e6)


            // TODO: add compliance
            const alpha = this.compliance / dt / dt;
            const C = len - restLen;
            // const s = -C / w;
            const s = -C / (w + alpha);

            const numX = 32;
            const numY = 21;

            if (Math.abs(C) <= 0.001)
                continue

            if (id0 % numY === id1 % numY && Math.abs(C) > 0) {
                // console.log(id0 / numY, id1 / numY, 'C=', C)
                // console.log(s)
            }

            try {
                assert(!isNaN(s))
            } catch (e) {
                console.log(id0, id1)
                console.log(vecAt(this.positionArray, id0))
                console.log(vecAt(this.positionArray, id1))
                console.log(len, C, w)
                throw 'adskjl'
            }

            const bef0 = vecAt(this.positionArray, id0).slice();
            const bef1 = vecAt(this.positionArray, id1).slice();
            vecScale(diff, 0, 1.0 / len);  // set to unit vector
            vecAdd(this.positionArray, id0, diff, s * w0);
            vecAdd(this.positionArray, id1, diff, -s * w1);
            try {
                for (let i = 0; i < 3; i++) {
                    assert(!isNaN(vecAt(this.positionArray, id0)[i]))
                }
            } catch (e) {
                console.log(id0, id1)
                console.log(bef0)
                console.log(bef1)
                console.log(diff)
                console.log(vecAt(this.positionArray, id0))
                console.log(vecAt(this.positionArray, id1))
                console.log(len, C, w)
                throw '2'
            }
        }
    }
}

export class VolumeConstraint extends Constraint {
    invMass: Float32Array;
    positionArray: Float32Array;
    numTets: number;
    maxnumOfTets: number;
    tetIds: number[];
    restVol: Float32Array;
    volCompliance: number;
    temp: Float32Array;
    grads: Float32Array;
    volIdOrder: number[][];

    constructor(
        maxnumOfTets: number,
        volCompliance: number =0,
        invMass: Float32Array,
        positionArray: Float32Array
    ) {
        super();
        this.invMass = invMass;
        this.positionArray = positionArray;
        this.numTets = 0;
        this.maxnumOfTets = maxnumOfTets;
        this.tetIds = new Array(maxnumOfTets * 4).fill(-1);
        this.restVol = new Float32Array(maxnumOfTets);
        this.volCompliance = volCompliance;

        this.temp = new Float32Array(4 * 3);
        this.grads = new Float32Array(4 * 3);
        this.volIdOrder = [[1, 3, 2], [0, 2, 3], [0, 3, 1], [0, 1, 2]];
    }

    addConstraint(id0: number, id1: number, id2: number, id3: number, vol: number) {
        const i = this.numTets;
        if (i >= this.maxnumOfTets) {
            throw new Error("Constraint array is full");
        }
        this.tetIds[4 * i] = id0;
        this.tetIds[4 * i + 1] = id1;
        this.tetIds[4 * i + 2] = id2;
        this.tetIds[4 * i + 3] = id3;
        this.restVol[i] = vol;
        this.numTets++;
    }

    solve(dt: number): void {
        const alpha = this.volCompliance / (dt * dt) / 20000;

        for (let i = 0; i < this.numTets; i++) {
            if (this.tetIds[4 * i] === -1) continue;

            var w = 0.0;

            for (let j = 0; j < 4; j++) {
                const id0 = this.tetIds[4 * i + this.volIdOrder[j][0]];
                const id1 = this.tetIds[4 * i + this.volIdOrder[j][1]];
                const id2 = this.tetIds[4 * i + this.volIdOrder[j][2]];
                // console.log(id0, id1, id2);

                vecSetDiff(this.temp, 0, vecAt(this.positionArray, id1), vecAt(this.positionArray, id0));
                vecSetDiff(this.temp, 1, vecAt(this.positionArray, id2), vecAt(this.positionArray, id0));
                vecSetCross(this.grads, j, vecAt(this.temp, 0), vecAt(this.temp, 1));
                vecScale(this.grads, j, 1.0 / 6.0);

                // const dw = this.invMass[this.tetIds[4 * i + j]] * vecLengthSquared(this.grads, j);
                // if (isNaN(dw)) {
                //     console.log(id0, id1, id2);
                //     console.log(this.grads);
                //     console.log(this.invMass[4*i+j]);
                //     console.log(this.invMass.length);
                // }
                // // assert(!isNaN(dw), "NaN in softbody dw"+i);
                w += this.invMass[this.tetIds[4 * i + j]] * vecLengthSquared(this.grads, j);
            }
            if (w == 0.0) continue;

            const vol = getTetVolume(i, this.tetIds, this.positionArray);
            const restVol = this.restVol[i];
            const C = vol - restVol;
            const lambda = - C / (w + alpha);

            // assert((!isNaN(lambda) && !isNaN(vol) && !isNaN(C) && !isNaN(w)), lambda+"-"+vol+"-"+C+"-"+w+"-"+i);

            for (let j = 0; j < 4; j++) {
                const id = this.tetIds[4 * i + j];
                vecAdd(this.positionArray, id, vecAt(this.grads, j), lambda * this.invMass[id]);
            }
        }
    }
}


export class DistanceConstraintMulti extends Constraint {
    #vecs = new Float32Array(2 * 3);

    objects: Map<number, PBDObject>;


    #numConstraints = 0;
    objIds: Uint32Array;
    particleIds: Uint32Array;
    restLens: Float32Array;
    compliance: number;

    constructor(
        maxNumConstraints: number,
        // invMass: Float32Array,
        // positionArray: Float32Array,
        objects: Map<number, PBDObject>,
        options: DistanceConstraintOptions = {},
    ) {

        let {
            // initialPositions,
            compliance = 0.0,
        } = options;

        super();
        this.objects = objects;
        // this.invMass = invMass;
        // this.positionArray = positionArray;
        // if (!initialPositions)
        //     initialPositions = positionArray.slice();

        // this.initialPositions = initialPositions;

        this.objIds = new Uint32Array(maxNumConstraints * 2).fill(-1);
        this.particleIds = new Uint32Array(maxNumConstraints * 2).fill(-1);
        this.restLens = new Float32Array(maxNumConstraints).fill(-1);
        this.compliance = compliance;

        // console.log(positionArray.length)
    }

    addConstraint(objId0: number, id0: number, objId1: number, id1: number) {
        const obj0 = this.objects.get(objId0)!;
        const obj1 = this.objects.get(objId1)!;

        if (!vecIsValid(obj0.positionArray, id0) || !vecIsValid(obj1.positionArray, id1)) {
            return;
        }

        if (this.#numConstraints >= this.particleIds.length / 2) {
            throw new Error("Constraint array is full");
        }

        this.objIds[this.#numConstraints * 2] = objId0;
        this.objIds[this.#numConstraints * 2 + 1] = objId1;
        this.particleIds[this.#numConstraints * 2] = id0;
        this.particleIds[this.#numConstraints * 2 + 1] = id1;

        const pos0 = vecAt(obj0.initialPositionArray, id0);
        const pos1 = vecAt(obj1.initialPositionArray, id1);
        vecSetDiff(this.#vecs, 0, pos0, pos1);
        this.restLens[this.#numConstraints] = Math.sqrt(vecLengthSquared(this.#vecs, 0));

        this.#numConstraints++;
    }

    has(objId0: number, id0: number, objId1: number, id1: number) {
        for (let i = 0; i < this.numConstraints; i++) {
            if (this.objIds[2 * i] === objId0 && this.objIds[2 * i + 1] === objId1)
                if (this.particleIds[2 * i] === id0 && this.particleIds[2 * i + 1] === id1) {
                    return true;
                }
        }
        return false;
    }

    suffle() {
        for (let i = 0; i < this.numConstraints; i++) {
            const j = Math.floor(Math.random() * this.#numConstraints);
            let temp;
            temp = this.particleIds[i * 2], this.particleIds[i * 2] = this.particleIds[j * 2], this.particleIds[j * 2] = temp;
            temp = this.particleIds[i * 2 + 1], this.particleIds[i * 2 + 1] = this.particleIds[j * 2 + 1], this.particleIds[j * 2 + 1] = temp;
            temp = this.restLens[i], this.restLens[i] = this.restLens[j], this.restLens[j] = temp;
        }
    }

    get numConstraints() {
        return this.#numConstraints;
    }

    solve(dt: number): void {
        for (var i = 0; i < this.numConstraints; i++) {
            const obj0 = this.objects.get(this.objIds[2 * i])!;
            const obj1 = this.objects.get(this.objIds[2 * i + 1])!;
            const id0 = this.particleIds[2 * i];
            const id1 = this.particleIds[2 * i + 1];
            if (!obj0 || !obj1) return;
            if (id0 === -1 || id1 === -1) continue;

            const w0 = obj0.invMass[id0];
            const w1 = obj1.invMass[id1];
            const w = w0 + w1;
            if (w == 0.0)
                continue;

            const diff = vecAt(this.#vecs, 0);
            vecSetDiff(diff, 0, vecAt(obj0.positionArray, id0), vecAt(obj1.positionArray, id1));
            const len = Math.sqrt(vecLengthSquared(diff, 0));
            if (len == 0.0)
                continue;

            const restLen = this.restLens[i];
            assert(Math.abs(restLen - 0.1) < 1e6)


            // TODO: add compliance
            const alpha = this.compliance / dt / dt;
            const C = len - restLen;
            // const s = -C / w;
            const s = -C / (w + alpha);

            const numX = 32;
            const numY = 21;

            if (Math.abs(C) <= 0.001)
                continue

            if (id0 % numY === id1 % numY && Math.abs(C) > 0) {
                // console.log(id0 / numY, id1 / numY, 'C=', C)
                // console.log(s)
            }

            try {
                assert(!isNaN(s))
            } catch (e) {
                console.log(id0, id1)
                console.log(vecAt(obj0.positionArray, id0))
                console.log(vecAt(obj1.positionArray, id1))
                console.log(len, C, w)
                throw 'adskjl'
            }

            const bef0 = vecAt(obj0.positionArray, id0).slice();
            const bef1 = vecAt(obj1.positionArray, id1).slice();
            vecScale(diff, 0, 1.0 / len);  // set to unit vector
            vecAdd(obj0.positionArray, id0, diff, s * w0);
            vecAdd(obj1.positionArray, id1, diff, -s * w1);
            try {
                for (let i = 0; i < 3; i++) {
                    assert(!isNaN(vecAt(obj0.positionArray, id0)[i]))
                }
            } catch (e) {
                console.log(id0, id1)
                console.log(bef0)
                console.log(bef1)
                console.log(diff)
                console.log(vecAt(obj0.positionArray, id0))
                console.log(vecAt(obj1.positionArray, id1))
                console.log(len, C, w)
                throw '2'
            }
        }
    }
}
