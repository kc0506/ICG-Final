
import { BufferAttribute, BufferGeometry } from "three";
import { PBDObject } from "./PBDObject";
import { Constraint, DistanceConstraint } from "./constraint";

export type ClothOptions = {
    spacing: number;
    // initialPositions: Float32Array;
    enableCollision: boolean;
};


export class Cloth extends PBDObject {
    #geometry: BufferGeometry;

    constraints: Constraint[] = [];

    // distConstraints:    

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


        // * Constraints
        const stretchConstraints = new DistanceConstraint(2 * numX * numY, invMass, positionArray);
        for (let i = 0; i < numX; i++) {
            for (let j = 0; j < numY-1; j++) {
                stretchConstraints.addConstraint(i * numY + j, i * numY + j + 1);
                // TODO: horizontal constraints cause crash
                // stretchConstraints.addConstraint(i * numY + j, (i + 1) * numY + j);
            }
        }
        this.constraints.push(stretchConstraints);

        // * Geometry
        const triIds: number[] = [];
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
        this.#geometry.setAttribute("uv", new BufferAttribute(this.createUVArray(numX, numY, 'front'), 2));
        this.#geometry.setIndex(triIds);
        this.#geometry.computeVertexNormals();
    }



    createUVArray(numX: number, numY: number, side: 'front' | 'back') {
        const numParticles = numX * numY;
        const uvArray = new Float32Array(numParticles * 2);
        for (let i = 0; i < numX; i++) {
            for (let j = 0; j < numY; j++) {
                const id = i * numY + j;
                // uvArray.set([i / numX, j / numY], 2 * id);
                if (side === 'front') {
                    uvArray.set([i / numX, j / numY], 2 * id);
                } else {
                    uvArray.set([i / numX, 1 - j / numY], 2 * id);
                }
            }
        }
        return uvArray;

    }


    get geometry() {
        return this.#geometry;
    }

    solveConstraints(dt: number): void {
        for (const constraint of this.constraints) {
            constraint.solve(dt);
        }
    }

    update(): void {
        this.geometry.getAttribute("position").needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.geometry.computeBoundingSphere();
    }
}