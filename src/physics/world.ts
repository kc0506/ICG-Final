
import * as THREE from "three";
import { assert } from "../utils";
import { vecAdd, vecAt, vecCopy, vecScale, vecSetDiff } from "../vecUtils";
import { PBDObject } from "./PBDObject";

type WorldProps = {
    numSubsteps: number;
};

export class World {
    objects: Set<PBDObject> = new Set();
    #numSubsteps;
    constructor({ numSubsteps }: WorldProps) {
        this.#numSubsteps = numSubsteps;
    }

    update(dt: number, force: THREE.Vector3) {
        // * The main xPBD loop
        if (dt === 0) return

        for (let n = 0; n < this.#numSubsteps; n++) {
            const subDt = dt / this.#numSubsteps;

            for (let obj of this.objects) {

                // 1. Apply force
                for (let i = 0; i < obj.numParticles; i++) {
                    vecAdd(obj.velocityArray, i, force, subDt * obj.invMass[i]);
                    vecCopy(obj.prevPositionArray, i, vecAt(obj.positionArray, i));
                    vecAdd(obj.positionArray, i, vecAt(obj.velocityArray, i), subDt);
                }

                // 2. Solve constraints
                obj.solveConstraints();

                // 3. Update velocity
                for (let i = 0; i < obj.numParticles; i++) {
                    vecSetDiff(
                        obj.velocityArray,
                        i,
                        vecAt(obj.positionArray, i),
                        vecAt(obj.prevPositionArray, i)
                    );
                    vecScale(obj.velocityArray, i, 1 / subDt);
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