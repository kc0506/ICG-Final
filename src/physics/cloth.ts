
import { BufferAttribute, BufferGeometry } from "three";
import { PBDObject } from "./PBDObject";

export type ClothOptions = {
    spacing: number;
    // initialPositions: Float32Array;
    enableCollision: boolean;
};

export class Cloth extends PBDObject {
    #geometry: BufferGeometry;

    // ? seems not necessary
    // frontGeometry: BufferGeometry;
    // backGeometry: BufferGeometry;

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

        // * UV        

        this.#geometry = new BufferGeometry();
        this.#geometry.setAttribute("position", new BufferAttribute(positionArray, 3));
        this.#geometry.setAttribute("uv", new BufferAttribute(this.createUVArray(numX, numY, 'front'), 2));
        this.#geometry.setIndex(triIds);
        this.#geometry.computeVertexNormals();


        // this.frontGeometry = new BufferGeometry();
        // this.frontGeometry.setAttribute("position", new BufferAttribute(positionArray, 3));
        // this.frontGeometry.setAttribute("uv", new BufferAttribute(this.createUVArray(numX, numY, 'front'), 2));
        // this.frontGeometry.setIndex(triIds);
        // this.frontGeometry.computeVertexNormals();

        // this.backGeometry = new BufferGeometry();
        // this.backGeometry.setAttribute("position", new BufferAttribute(positionArray, 3));
        // this.backGeometry.setAttribute("uv", new BufferAttribute(this.createUVArray(numX, numY, 'back'), 2));
        // this.backGeometry.setIndex(triIds);
        // this.backGeometry.computeVertexNormals();
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

    solveConstraints(): void {

    }

    update(): void {
        this.geometry.getAttribute("position").needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.geometry.computeBoundingSphere();

        // this.frontGeometry.getAttribute("position").needsUpdate = true;
        // this.frontGeometry.computeVertexNormals();
        // this.frontGeometry.computeBoundingSphere();
        // this.backGeometry.getAttribute("position").needsUpdate = true;
        // this.backGeometry.computeVertexNormals();
        // this.backGeometry.computeBoundingSphere();
    }
}