// This class is modified from ten-minute physics

import { assert } from "./utils";
import { vecAt } from "./vecUtils";

export class Hash {
    spacing: number;
    tableSize: number;
    cellStart: Int32Array;
    cellObjectId: Int32Array;
    cellPosId: Int32Array;
    queryObjectIds: Int32Array;
    queryPosIds: Int32Array;
    querySize: number;
    maxNumObjects: number;

    constructor(spacing: number, maxNumObjects: number) {
        this.spacing = spacing;
        this.tableSize = 5 * maxNumObjects;
        this.cellStart = new Int32Array(this.tableSize + 1);
        this.cellObjectId = new Int32Array(maxNumObjects);
        this.cellPosId = new Int32Array(maxNumObjects);
        this.queryObjectIds = new Int32Array(maxNumObjects);
        this.queryPosIds = new Int32Array(maxNumObjects);
        this.querySize = 0;

        this.maxNumObjects = maxNumObjects;
        // this.firstAdjId = new Int32Array(maxNumObjects + 1);
        // this.adjIds = new Int32Array(10 * maxNumObjects);
    }

    hashCoords(x: number, y: number, z: number) {
        var h = (x * 92837111) ^ (y * 689287499) ^ (z * 283923481);	// fantasy function
        return Math.abs(h) % this.tableSize;
    }

    intCoord(coord: number) {
        return Math.floor(coord / this.spacing);
    }

    hashPos(pos: number[] | Float32Array) {
        return this.hashCoords(
            this.intCoord(pos[0]),
            this.intCoord(pos[1]),
            this.intCoord(pos[2])
        );
    }

    create(positionArrays: Float32Array[], objectIds: Int32Array | number[]) {
        this.cellStart.fill(0);
        this.cellObjectId.fill(0);
        this.cellPosId.fill(0);
        // var numObjects = Math.min(pos.length / 3, this.cellEntries.length);

        // const totalParticles = positionArrays.reduce((acc, pos) => acc + pos.length / 3, 0);
        // this.maxNumObjects = Math.min(totalParticles, this.maxNumObjects);
        const numObjects = this.maxNumObjects;

        // determine cell sizes
        for (const pos of positionArrays) {
            for (let i = 0; i < pos.length / 3; i++) {
                const h = this.hashPos(vecAt(pos, i));
                // console.log('i',h)
                this.cellStart[h]++;
                assert(this.cellStart[h] <= numObjects)
            }
        }

        // determine cells starts
        let start = 0;
        for (let i = 0; i < this.tableSize; i++) {
            start += this.cellStart[i];
            this.cellStart[i] = start;
        }
        this.cellStart[this.tableSize] = start;	// guard

        // fill in objects ids

        for (let posIdx = 0; posIdx < positionArrays.length; posIdx++) {
            const pos = positionArrays[posIdx];
            for (let i = 0; i < pos.length / 3; i++) {
                const h = this.hashPos(vecAt(pos, i));
                // console.log(i,h)
                assert(this.cellStart[h] > 0);
                this.cellStart[h]--;
                this.cellObjectId[this.cellStart[h]] = objectIds[posIdx];
                this.cellPosId[this.cellStart[h]] = i;
            }
        }

    }

    query(pos: number[] | Float32Array, maxDist: number) {
        const x0 = this.intCoord(pos[0] - maxDist);
        const y0 = this.intCoord(pos[1] - maxDist);
        const z0 = this.intCoord(pos[2] - maxDist);

        const x1 = this.intCoord(pos[0] + maxDist);
        const y1 = this.intCoord(pos[1] + maxDist);
        const z1 = this.intCoord(pos[2] + maxDist);

        this.queryObjectIds.fill(-1);
        this.queryPosIds.fill(-1);
        this.querySize = 0;
        // console.log('before')
        // console.log(this.queryPosIds.slice(0, 10))
        for (let xi = x0; xi <= x1; xi++) {
            for (let yi = y0; yi <= y1; yi++) {
                for (let zi = z0; zi <= z1; zi++) {
                    const h = this.hashCoords(xi, yi, zi);
                    const start = this.cellStart[h];
                    const end = this.cellStart[h + 1];

                    for (let i = start; i < end; i++) {
                        this.queryObjectIds[this.querySize] = this.cellObjectId[i];
                        this.queryPosIds[this.querySize] = this.cellPosId[i];
                        this.querySize++;
                    }
                }
            }
        }
    }

    // queryAll(pos, maxDist) {

    //     const num = 0;
    //     const maxDist2 = maxDist * maxDist;

    //     for (const i = 0; i < this.maxNumObjects; i++) {
    //         const id0 = i;
    //         this.firstAdjId[id0] = num;
    //         this.query(pos, id0, maxDist);

    //         for (const j = 0; j < this.querySize; j++) {
    //             const id1 = this.queryObjectIds[j];
    //             if (id1 >= id0)
    //                 continue;
    //             const dist2 = vecDistSquared(pos, id0, pos, id1);
    //             if (dist2 > maxDist2)
    //                 continue;

    //             if (num >= this.adjIds.length) {
    //                 const newIds = new Int32Array(2 * num);  // dynamic array
    //                 newIds.set(this.adjIds);
    //                 this.adjIds = newIds;
    //             }
    //             this.adjIds[num++] = id1;
    //         }
    //     }

    //     this.firstAdjId[this.maxNumObjects] = num;
    // }
}