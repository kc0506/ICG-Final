
import * as THREE from "three";
import { assert } from "../utils";
import { vecAdd, vecAt, vecCopy, vecScale, vecSetDiff, vecSub } from "../vecUtils";
import { PBDObject } from "./PBDObject";

type WorldProps = {
    numSubsteps: number;
};

export class World {

    objects: Set<PBDObject> = new Set();
    #tmpVecs = new Float32Array(10 * 3);

    #minDistance = 0.01;
    #numSubsteps;
    constructor({ numSubsteps }: WorldProps) {
        this.#numSubsteps = numSubsteps;
    }

    solveCollisions() {
        // 1. Ground
        // dx = -lambda * M^-1 * grad C
        // lambda = C / sum(1/m * grad C)

        // For ground:
        // C(x,y,z) = y - minDistance
        // del C = (0, 1, 0)
        // dx = -(y - d) * (0, 1, 0)
        const tmp = vecAt(this.#tmpVecs, 0);
        tmp.set([0, 1, 0]);
        const tmp1 = vecAt(this.#tmpVecs, 1);

        for (let obj of this.objects) {
            for (let i = 0; i < obj.numParticles; i++) {
                if (obj.invMass[i] === 0) continue;

                const pos = vecAt(obj.positionArray, i);
                const C = pos[1] + 2 - this.#minDistance;
                if (C > 0)
                    continue;

                // ! this line let bounce working 
                // ! but I am not sure LOL
                vecCopy(obj.prevPositionArray, i, vecAt(obj.positionArray, i));

                vecAdd(obj.positionArray, i, tmp, -C);
            }
        }
    }

    update(dt: number, force: THREE.Vector3) {
        // * The main xPBD loop
        if (dt === 0) return

        for (let n = 0; n < this.#numSubsteps; n++) {
            const subDt = dt / this.#numSubsteps;

            // 1. Apply force
            // todo: max velocity
            // const maxVelocity = 0.2 * this.#minDistance / dt;
            for (let obj of this.objects) {
                for (let i = 0; i < obj.numParticles; i++) {
                    vecAdd(obj.velocityArray, i, force, subDt * obj.invMass[i]);
                    vecCopy(obj.prevPositionArray, i, vecAt(obj.positionArray, i));
                    vecAdd(obj.positionArray, i, vecAt(obj.velocityArray, i), subDt);
                }
            }

            // 2. Solve constraints
            this.solveCollisions();
            for (let obj of this.objects) {
                obj.solveConstraints();
            }

            // 3. Update velocity
            const invSubDt = 1 / subDt;
            for (let obj of this.objects) {
                for (let i = 0; i < obj.numParticles; i++) {
                    vecSetDiff(
                        obj.velocityArray,
                        i,
                        vecAt(obj.positionArray, i),
                        vecAt(obj.prevPositionArray, i)
                    );
                    vecScale(obj.velocityArray, i, invSubDt);
                    if (vecAt(obj.velocityArray, i)[1] > 0) {
                        console.log('positive')
                    }
                }

                // console.log("log", 1 / subDt);
                // console.log(obj.positionArray);
                // console.log(obj.prevPositionArray);
                // console.log(obj.velocityArray);

                for (let x of obj.positionArray) {
                    assert(!isNaN(x), "NaN in positionArray");
                }
                obj.update();
            }
        }
    }

    add(obj: PBDObject) {
        this.objects.add(obj);
    }

    remove(obj: PBDObject) {
        this.objects.delete(obj);
    }
}