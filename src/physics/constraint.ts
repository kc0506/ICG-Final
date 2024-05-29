import { assert } from "../utils";
import { vecAdd, vecAt, vecIsValid, vecLengthSquared, vecScale, vecSetDiff } from "../vecUtils";

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
