import { assert } from "../utils";
import { vecAdd, vecAt, vecIsValid, vecLengthSquared, vecScale, vecSetDiff } from "../vecUtils";

export abstract class Constraint {
    abstract solve(dt: number): void
}


export class DistanceConstraint extends Constraint {
    #vecs = new Float32Array(2 * 3);

    invMass: Float32Array;
    positionArray: Float32Array
    initialPositions: Float32Array;

    #cnt = 0;
    ids: Uint32Array;
    restLens: Float32Array;

    constructor(maxNumConstraints: number, invMass: Float32Array, positionArray: Float32Array) {
        super();
        this.invMass = invMass;
        this.positionArray = positionArray;
        this.initialPositions = positionArray.slice();

        this.ids = new Uint32Array(maxNumConstraints * 2).fill(-1);
        this.restLens = new Float32Array(maxNumConstraints);

        console.log(positionArray.length)
    }

    addConstraint(id0: number, id1: number) {
        if (!vecIsValid(this.positionArray, id0) || !vecIsValid(this.positionArray, id1))
            return;
        // console.log('addConstraint', id0, id1)

        if (this.#cnt >= this.ids.length / 2) {
            throw new Error("Constraint array is full");
        }

        this.ids[this.#cnt * 2] = id0;
        this.ids[this.#cnt * 2 + 1] = id1;

        const pos1 = vecAt(this.positionArray, id0);
        const pos2 = vecAt(this.positionArray, id1);
        vecSetDiff(this.#vecs, 0, pos1, pos2);
        this.restLens[this.#cnt] = Math.sqrt(vecLengthSquared(this.#vecs, 0));

        this.#cnt++;
    }

    get numConstraints() {
        return this.#cnt;
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
            const C = len - restLen;
            // TODO: add compliance
            // const alpha = 0.00 / dt / dt;
            // const s = -C / (w + alpha);
            const s = -C / w;
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
