import { Hash } from "../hash";
import { assert } from "../utils";
import { vecAdd, vecAt, vecDistSquared, vecLengthSquared, vecScale, vecSetDiff, vecSetSum, vecSub } from "../vecUtils";
import { PBDObject } from "./PBDObject";


const tmpVecs = new Float32Array(10 * 3);

export function solveCollisions(
    objects: Map<number, PBDObject>,
    minDistance: number,
    hash: Hash,
) {
    // TODO: use hash to reduce complexity, currently O(n^2)
    // TODO: handle collision across multiple objects
    // minDistance=0.2;

    for (let obj of objects.values()) {
        if (!obj.enableCollision)
            continue;
        for (let i = 0; i < obj.numParticles; i++) {
            if (obj.invMass[i] === 0) continue;

            hash.query(vecAt(obj.positionArray, i), minDistance);
            if (hash.querySize === 1) {
                // assert(hash.queryObjectIds[0] === obj.id)
                // continue;
            }
            for (let j = 0; j < hash.querySize; j++) {
                const objId = hash.queryObjectIds[j];
                const particleId = hash.queryPosIds[j];
                assert(objId !== -1)
                // console.log(objects)
                // console.log(hash.queryObjectIds.slice(0, 10))
                // console.log(hash.queryPosIds.slice(0, 10))
                // console.log('query', hash.querySize)


                // console.log(obj.id, objId)
                // console.log(getObj([...objects], objId).id)

                solveCollisionPair(
                    obj,
                    objects.get(objId) as PBDObject,
                    // obj,
                    i,
                    particleId,
                    minDistance,
                );
            }


            // for (let j = i+1; j < obj.numParticles; j++) {

            //     if (obj.invMass[j] === 0) continue;

            //     solveCollisionPair(
            //         obj,
            //         obj,
            //         i,
            //         j,
            //         minDistance,
            //     );
            // }
        }
    }
}

function solveCollisionPair(
    // invMass: Float32Array,
    // prevPositionArray: Float32Array,
    // positionArray: Float32Array,
    obj0: PBDObject,
    obj1: PBDObject,
    id0: number,
    id1: number,
    minDistance: number,
) {
    if (id0 === id1) return;

    // minDistance = 0.2

    const minDistance2 = minDistance * minDistance;
    const pos0 = vecAt(obj0.positionArray, id0);
    const pos1 = vecAt(obj1.positionArray, id1);

    const diff = vecAt(tmpVecs, 0);
    vecSetDiff(diff, 0, pos1, pos0);

    const rest0 = vecAt(obj0.initialPositionArray, id0);
    const rest1 = vecAt(obj1.initialPositionArray, id1);
    const restDist2 = vecDistSquared(rest0, rest1);

    const dist2 = vecLengthSquared(diff, 0);
    if (dist2 > minDistance2 || dist2 === 0)
        return;
    if (dist2 > restDist2)
        return;
    // console.log('hi')

    // const restDist2 = vecDistSquared(this.restPos, id0, this.restPos, id1);
    // if (restDist2 < thickness2)
    //     minDist = Math.sqrt(restDist2);

    // position correction
    const dist = Math.sqrt(dist2);
    assert(minDistance - dist > 0, 'minDistance - dist > 0')
    vecScale(diff, 0, (minDistance - dist) / dist);
    vecAdd(obj0.positionArray, id0, diff, -0.5);
    vecAdd(obj1.positionArray, id1, diff, 0.5);

    return;
    vecSetDiff(diff, 0, pos0, pos1);
    // console.log(minDistance)
    // console.log(vecLengthSquared(diff, 0))

    // velocities
    vecSetDiff(tmpVecs, 0, pos0, vecAt(obj0.prevPositionArray, id0));
    vecSetDiff(tmpVecs, 1, pos1, vecAt(obj1.prevPositionArray, id1));

    // average velocity
    vecSetSum(tmpVecs, 2, vecAt(tmpVecs, 0), vecAt(tmpVecs, 1));
    vecScale(tmpVecs, 2, 0.5);

    // velocity corrections
    vecSub(tmpVecs, 0, vecAt(tmpVecs, 2))
    vecSub(tmpVecs, 1, vecAt(tmpVecs, 2))

    // add corrections
    const friction = 0.0;
    vecAdd(obj0.positionArray, id0, vecAt(tmpVecs, 0), friction);
    vecAdd(obj1.positionArray, id1, vecAt(tmpVecs, 1), friction);

}