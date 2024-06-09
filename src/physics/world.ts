
import * as THREE from "three";
import { assert } from "../utils";
import { vecAdd, vecAt, vecCopy, vecDistSquared, vecLengthSquared, vecScale, vecSetDiff, vecSub } from "../vecUtils";
import { PBDObject } from "./PBDObject";
import { solveCollisions } from "./collision";
import { Hash } from "../hash";
import { Constraint } from "./constraint";

type WorldProps = {
    numSubsteps: number;
};

export class World {

    hash: Hash;

    objects: Map<number, PBDObject> = new Map();
    #tmpVecs = new Float32Array(10 * 3);

    #minDistance = 0.1;
    #numSubsteps;
    constructor({ numSubsteps }: WorldProps) {
        this.#numSubsteps = numSubsteps;
        this.hash = new Hash(this.#minDistance / 2, 10000);
    }

    constraints: Constraint[] = []

    addConstraint(constraint: Constraint) {
        this.constraints.push(constraint)
    }


    solveCollisions() {
        // 1. Ground
        // dx = -lambda * M^-1 * grad C
        // lambda = C / sum(1/m * grad C)

        // For ground:
        // C(x,y,z) = y - minDistance
        // del C = (0, 1, 0)
        // dx = -(y - d) * (0, 1, 0)
        const normal = vecAt(this.#tmpVecs, 0);
        normal.set([0, 1, 0]);

        const tmp1 = vecAt(this.#tmpVecs, 1);

        let flag = false
        for (let [_, obj] of this.objects) {
            for (let i = 0; i < obj.numParticles; i++) {
                if (obj.invMass[i] === 0) continue;

                const pos = vecAt(obj.positionArray, i);
                const C = pos[1] + 2 - this.#minDistance;
                if (C > 0)
                    continue;
                flag = true

                const damping = 1.0
                vecSetDiff(tmp1, 0, vecAt(obj.positionArray, i), vecAt(obj.prevPositionArray, i));
                vecAdd(obj.positionArray, i, tmp1, -damping);
                vecAt(obj.positionArray, i)[1] = this.#minDistance - 2;

                // ! this line let bounce working 
                // ! but I am not sure LOL
                // vecCopy(obj.prevPositionArray, i, vecAt(obj.positionArray, i));
                // vecAdd(obj.positionArray, i, tmp, -C);
            }
        }
    }

    update(dt: number, force: THREE.Vector3) {
        // * The main xPBD loop
        if (dt === 0) return
        // console.log('update')


        const posArrays = [... this.objects].map(([_, obj]) => obj.positionArray);
        const objIds = [... this.objects].map(([_, obj]) => obj.id);
        this.hash.create(posArrays, objIds);

        {
            const obj = this.objects.get(this.dragId);
            if (obj && obj.id === this.dragId) {
                for (const i of this.dragParticleIds) {
                    vecSub(obj.positionArray, i, this.dragPos)
                    vecAdd(obj.positionArray, i, this.nextDragPos)
                }
            }
        }

        for (let n = 0; n < this.#numSubsteps; n++) {
            const subDt = dt / this.#numSubsteps;

            // 1. Apply force
            // todo: max velocity
            const maxVelocity = this.#minDistance / dt;
            for (let obj of this.objects.values()) {
                for (let i = 0; i < obj.numParticles; i++) {
                    if (obj.invMass[i] === 0) continue; // handle fixed particles
                    vecAdd(obj.velocityArray, i, force, subDt);
                    const curVelocity = vecLengthSquared(obj.velocityArray, i);
                    if (curVelocity > maxVelocity * maxVelocity) {
                        vecScale(obj.velocityArray, i, maxVelocity / Math.sqrt(curVelocity));
                    }

                    vecCopy(obj.prevPositionArray, i, vecAt(obj.positionArray, i));
                    vecAdd(obj.positionArray, i, vecAt(obj.velocityArray, i), subDt);
                }
            }


            // 2. Solve constraints
            this.solveCollisions();
            for (const constraint of this.constraints) {
                constraint.solve(subDt)
            }
            for (let obj of this.objects.values()) {
                obj.solveConstraints(subDt);
            }
            solveCollisions(this.objects, this.#minDistance, this.hash);


            // 3. Update velocity
            const invSubDt = 1 / subDt;
            for (let obj of this.objects.values()) {
                for (let i = 0; i < obj.numParticles; i++) {
                    vecSetDiff(
                        obj.velocityArray,
                        i,
                        vecAt(obj.positionArray, i),
                        vecAt(obj.prevPositionArray, i)
                    );
                    vecScale(obj.velocityArray, i, invSubDt);
                    if (vecAt(obj.velocityArray, i)[1] > 0) {
                        // console.log('positive')
                    }
                }

                for (let x of obj.positionArray) {
                    assert(!isNaN(x), "NaN in positionArray");
                }
                for (let x of obj.velocityArray) {
                    assert(!isNaN(x), "NaN in velocityArray");
                }
                obj.update();
            }

            this.dragPos.copy(this.nextDragPos)
        }
    }

    add(obj: PBDObject) {
        this.objects.set(obj.id, obj);
    }

    remove(obj: PBDObject) {
        this.objects.delete(obj.id);
    }

    orginalInvMass: Map<number, number> = new Map();
    isDragging = false
    dragDist = 0;
    dragPos = new THREE.Vector3();
    nextDragPos = new THREE.Vector3();
    dragId = -1;
    dragParticleIds: number[] = [];
    startDrag(ray: THREE.Ray, distance: number, id: number) {
        console.log('start', id)
        const maxDragDistance = 0.1;

        // assert(!this.isDragging)
        this.isDragging = true;

        this.dragDist = distance;
        this.dragPos.copy(ray.origin);
        this.dragPos.addScaledVector(ray.direction, distance);
        this.nextDragPos.copy(this.dragPos);
        this.dragId = id;
        // console.log('drag center', this.dragCenterPos)

        this.dragParticleIds = [];
        // this.orginalInvMass = [];

        const dragInvMass = 0.00;

        // const obj = this.objects.get(id)!;
        // for (let i = 0; i < obj.numParticles; i++) {
        //     // console.log(obj.positionArray.slice(i * 3, i * 3 + 3))
        //     if (vecDistSquared(vecAt(obj.positionArray, i), this.dragPos) < maxDragDistance)
        //         this.dragParticleIds.push(i);
        // }
        this.hash.query(this.dragPos.toArray(), maxDragDistance);
        for (let i = 0; i < this.hash.querySize; i++) {
            const objId = this.hash.queryObjectIds[i];
            const particleId = this.hash.queryPosIds[i];
            if (objId !== id)
                continue;
            const obj = this.objects.get(objId);
            if (!obj) continue;
            if (vecDistSquared(vecAt(obj.positionArray, particleId), this.dragPos) > maxDragDistance)
                continue;

            if (!this.orginalInvMass.has(particleId)) {
                this.dragParticleIds.push(particleId);
                this.orginalInvMass.set(particleId, obj.invMass[particleId]);
                obj.invMass[particleId] = dragInvMass;
            }
        }
        // console.log(this.dragParticleIds)

        // const direction = ray.direction.clone();
    }

    tmp = new THREE.Vector3();
    #getDraggedPosition(ray: THREE.Ray) {
        this.tmp.copy(ray.origin);
        this.tmp.addScaledVector(ray.direction, this.dragDist);
        return this.tmp;
    }

    updateMouse(camera: THREE.Camera, x: number, y: number) {
        raycaster.setFromCamera(vec2.fromArray([x, y]), camera);
        const newDragPos = this.#getDraggedPosition(raycaster.ray);
        this.nextDragPos.copy(newDragPos);
        curPosition.copy(newDragPos);
    }

    endDrag() {
        const obj = this.objects.get(this.dragId);
        if (obj)
            for (let i = 0; i < this.dragParticleIds.length; i++) {
                const id = this.dragParticleIds[i];
                obj.invMass[id] = this.orginalInvMass.get(id)!;
            }

        console.log('end', this.dragId)
        this.isDragging = false;
        this.dragId = -1;
        this.dragParticleIds = [];
        this.orginalInvMass.clear();
    }
}

const raycaster = new THREE.Raycaster();
const vec2 = new THREE.Vector2();

export const curPosition = new THREE.Vector3();