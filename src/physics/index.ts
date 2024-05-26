import * as THREE from "three";
import { Vector3, BufferAttribute, BufferGeometry } from "three";
import { vecAdd, vecAt, vecCopy, vecScale, vecSetDiff } from "../vecUtils";
import { assert } from "../utils";

type WorldProps = {
    numSubsteps: number;
};

export class World {
    objects: PBDObject[] = [];
    #numSubsteps;
    constructor({ numSubsteps }: WorldProps) {
        this.#numSubsteps = numSubsteps;
    }

    update(dt: number, force: THREE.Vector3) {
        if (dt === 0) return;

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
                console.log(obj.positionArray);
                // console.log(obj.prevPositionArray);
                console.log(obj.velocityArray);

                for (let x of obj.positionArray) {
                    assert(!isNaN(x), "NaN in positionArray");
                }
            }
        }
    }

    add(obj: PBDObject) {
        this.objects.push(obj);
    }
}

type PBDObjectProps = {
    invMass: Float32Array;
    prevPositionArray: Float32Array;
    positionArray: Float32Array;
    velocityArray: Float32Array;

    enableCollision: boolean;
};
class PBDObject {
    invMass: Float32Array;
    prevPositionArray: Float32Array;
    positionArray: Float32Array;
    velocityArray: Float32Array;

    parentPosition: Vector3;
    parentVelocity: Vector3;

    #enableCollision;
    constructor({
        invMass,
        prevPositionArray,
        positionArray,
        velocityArray,

        enableCollision,
    }: PBDObjectProps) {
        this.#enableCollision = enableCollision;

        this.invMass = invMass;
        this.prevPositionArray = prevPositionArray;
        this.positionArray = positionArray;
        this.velocityArray = velocityArray;
        const numParticles = this.numParticles;
        assert(invMass.length === numParticles, "Invalid invMass length");
        assert(prevPositionArray.length === numParticles * 3, "Invalid prevPositionArray length");
        assert(positionArray.length === numParticles * 3, "Invalid positionArray length");
        assert(velocityArray.length === numParticles * 3, "Invalid velocityArray length");

        // consider pass parent in
        this.parentPosition = new Vector3();
        this.parentVelocity = new Vector3();
    }

    get numParticles() {
        return Math.floor(this.positionArray.length / 3);
    }

    solveConstraints() {}
}

type ClothOptions = {
    spacing: number;
    // initialPositions: Float32Array;
    enableCollision: boolean;
};

export class Cloth extends PBDObject {
    #geometry: BufferGeometry;
    // #positionArray: Float32Array;

    constructor(width: number, height: number, { spacing, enableCollision }: ClothOptions) {
        const numX = Math.ceil(width / spacing),
            numY = Math.ceil(height / spacing);

        const numParticles = numX * numY;
        const positionArray = new Float32Array(numX * numY * 3);
        for (let i = 0; i < numX; i++) {
            for (let j = 0; j < numY; j++) {
                const id = i * numY + j;
                positionArray.set([i * spacing, j * spacing, 0], 3 * id);
            }
        }
        const invMass = new Float32Array(numParticles).fill(1);
        const prevPositionArray = new Float32Array(numParticles * 3);
        const velocityArray = new Float32Array(numParticles * 3).fill(0);
        super({ invMass, positionArray, prevPositionArray, velocityArray, enableCollision });

        const triIds: number[] = [];
        // const edgeIds: number[] = [];

        for (var i = 0; i < numX; i++) {
            for (var j = 0; j < numY; j++) {
                var id = i * numY + j;
                if (i < numX - 1 && j < numY - 1) {
                    triIds.push(id + 1);
                    triIds.push(id);
                    triIds.push(id + 1 + numY);
                    triIds.push(id + 1 + numY);
                    triIds.push(id);
                    triIds.push(id + numY);
                }
                // if (i < numX - 1) {
                //     edgeIds.push(id);
                //     edgeIds.push(id + numY);
                // }
                // if (j < numY - 1) {
                //     edgeIds.push(id);
                //     edgeIds.push(id + 1);
                // }
            }
        }

        this.#geometry = new BufferGeometry();
        this.#geometry.setAttribute("position", new BufferAttribute(positionArray, 3));
        this.#geometry.setIndex(triIds);
        this.#geometry.computeVertexNormals();
    }

    get geometry() {
        return this.#geometry;
    }
}
