
import { BufferAttribute, BufferGeometry, Object3D, Vector3 } from "three";
import { PBDObject, PBDObjectOptions } from "./PBDObject";
import { Constraint, DistanceConstraint } from "./constraint";

export type ClothOptions = {
    spacing: number;
    initialPosition?: number[];
    initialEulers?: number[];
    // initialPositions: Float32Array;
    // enableCollision: boolean;
} & PBDObjectOptions;


export class Cloth extends PBDObject {
    #geometry: BufferGeometry;

    constraints: Constraint[] = [];
    numX: number;
    numY: number;

    // distConstraints:    

    constructor(width: number,
        height: number,
        {
            spacing,
            initialEulers,
            initialPosition,
            ...options
        }: ClothOptions
    ) {
        const numX = Math.ceil(width / spacing),
            numY = Math.ceil(height / spacing);

        const obj = new Object3D();
        if (initialPosition)
            obj.position.fromArray(initialPosition);
        if (initialEulers)
            obj.rotation.setFromVector3(new Vector3().fromArray(initialEulers));

        const numParticles = numX * numY;
        const positionArray = new Float32Array(numX * numY * 3);
        for (let i = 0; i < numX; i++) {
            for (let j = 0; j < numY; j++) {
                const id = i * numY + j;
                const x = i * spacing - width / 2
                const y = j * spacing - 1.5;
                const z = 0.1 * Math.random() - 0.02;
                positionArray.set(obj.localToWorld(new Vector3(x, y, z)).toArray(), 3 * id);
            }
        }
        const invMass = new Float32Array(numParticles).fill(1);
        const prevPositionArray = new Float32Array(numParticles * 3);
        const velocityArray = new Float32Array(numParticles * 3).fill(0);
        super({
            invMass, positionArray, prevPositionArray, velocityArray, ...options
        });


        // * Constraints
        const addConstraint = (constraint: DistanceConstraint, i1: number, j1: number, i2: number, j2: number) => {
            if (i1 < 0 || i1 >= numX || j1 < 0 || j1 >= numY)
                return;
            constraint.addConstraint(i1 * numY + j1, i2 * numY + j2);
        }

        const maxNumConstraints = 2 * numX * numY;
        const stretchConstraints = new DistanceConstraint(maxNumConstraints, invMass, positionArray);
        const shearConstraints = new DistanceConstraint(maxNumConstraints, invMass, positionArray, { compliance: 0.001 });
        const bendConstraints = new DistanceConstraint(maxNumConstraints, invMass, positionArray, { compliance: 1 });

        for (let i = 0; i < numX; i++) {
            for (let j = 0; j < numY - 1; j++) {
                addConstraint(stretchConstraints, i, j, i, j + 1);
                addConstraint(stretchConstraints, i, j, i + 1, j);

                addConstraint(shearConstraints, i, j, i + 1, j + 1);
                addConstraint(shearConstraints, i + 1, j, i, j + 1);

                addConstraint(bendConstraints, i, j, i + 2, j);
                addConstraint(bendConstraints, i, j, i, j + 2);
            }
        }
        stretchConstraints.suffle();
        shearConstraints.suffle();
        bendConstraints.suffle();

        this.constraints.push(stretchConstraints);
        this.constraints.push(shearConstraints);
        this.constraints.push(bendConstraints);


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

        this.numX = numX;
        this.numY = numY;
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