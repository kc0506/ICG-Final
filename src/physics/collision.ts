import { assert } from "../utils";
import { vecAdd, vecAt, vecLengthSquared, vecScale, vecSetDiff, vecSetSum, vecSub } from "../vecUtils";
import { PBDObject } from "./PBDObject";


const tmpVecs = new Float32Array(10 * 3);

export function solveCollisions(
    objects: Iterable<PBDObject>,
    minDistance: number,
) {
    // TODO: use hash to reduce complexity, currently O(n^2)
    // TODO: handle collision across multiple objects
    for (let obj of objects) {
        if (!obj.enableCollision)
            continue;
        for (let i = 0; i < obj.numParticles; i++) {
            if (obj.invMass[i] === 0) continue;

            for (let j = i + 1; j < obj.numParticles; j++) {
                if (obj.invMass[j] === 0) continue;

                solveCollisionPair(obj.invMass,
                    obj.prevPositionArray,
                    obj.positionArray,
                    i,
                    j,
                    minDistance,
                );
            }
        }
    }
}

function solveCollisionPair(
    invMass: Float32Array,
    prevPositionArray: Float32Array,
    positionArray: Float32Array,
    id0: number,
    id1: number,
    minDistance: number,
) {
    minDistance = 0.2

    const minDistance2 = minDistance * minDistance;
    const pos0 = vecAt(positionArray, id0);
    const pos1 = vecAt(positionArray, id1);

    const diff = vecAt(tmpVecs, 0);
    vecSetDiff(diff, 0, pos1, pos0);

    const dist2 = vecLengthSquared(diff, 0);
    if (dist2 > minDistance2 || dist2 === 0)
        return;

    // const restDist2 = vecDistSquared(this.restPos, id0, this.restPos, id1);
    // if (dist2 > restDist2)
    //     continue;
    // if (restDist2 < thickness2)
    //     minDist = Math.sqrt(restDist2);

    // position correction
    const dist = Math.sqrt(dist2);
    assert(minDistance - dist > 0, 'minDistance - dist > 0')
    vecScale(diff, 0, (minDistance - dist) / dist);
    vecAdd(positionArray, id0, diff, -0.5);
    vecAdd(positionArray, id1, diff, 0.5);

    return;
    vecSetDiff(diff, 0, pos0, pos1);
    // console.log(minDistance)
    // console.log(vecLengthSquared(diff, 0))

    // velocities
    vecSetDiff(tmpVecs, 0, pos0, vecAt(prevPositionArray, id0));
    vecSetDiff(tmpVecs, 1, pos1, vecAt(prevPositionArray, id1));

    // average velocity
    vecSetSum(tmpVecs, 2, vecAt(tmpVecs, 0), vecAt(tmpVecs, 1));
    vecScale(tmpVecs, 2, 0.5);

    // velocity corrections
    vecSub(tmpVecs, 0, vecAt(tmpVecs, 2))
    vecSub(tmpVecs, 1, vecAt(tmpVecs, 2))

    // add corrections
    const friction = 0.0;
    vecAdd(positionArray, id0, vecAt(tmpVecs, 0), friction);
    vecAdd(positionArray, id1, vecAt(tmpVecs, 1), friction);

}