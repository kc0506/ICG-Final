import { BufferAttribute, BufferGeometry } from "three";
import { PBDObject } from "./PBDObject";
import { DistanceConstraint } from "./constraint";
import { assert } from "../utils";

export class Pendulum extends PBDObject {

    // #geometry: BufferGeometry;
    // get geometry() {
    //     return this.#geometry;
    // }

    // Pendulum properties
    lengths: number[];
    constraint: DistanceConstraint;

    // grabId: number;
    // grabInvMass: number;

    constructor(masses: number[], lengths: number[], angles: number[], pinPos: number[] = [0.0, 0.0, 0.0], dir:number=0) {
        assert(masses.length === lengths.length && masses.length === angles.length, "Invalid masses and lengths length");

        const numParticles = masses.length+1;
        const positionArray = new Float32Array((numParticles) * 3);
        const invMass = new Float32Array(numParticles).fill(1);
        const prevPositionArray = new Float32Array((numParticles) * 3);
        const velocityArray = new Float32Array((numParticles) * 3).fill(0);
        
        const pos = [pinPos[0], pinPos[1], pinPos[2]];
        positionArray[0] = pos[0];
        positionArray[1] = pos[1];
        positionArray[2] = pos[2];
        invMass[0] = 0.0;
        for (let i = 1; i < numParticles; i++) {
            pos[Math.round(dir)] += lengths[i-1] * Math.sin(angles[i-1]);
            pos[1] -= lengths[i-1] * Math.cos(angles[i-1]);
            positionArray[3 * i] = pos[0];
            positionArray[3 * i + 1] = pos[1];
            positionArray[3 * i + 2] = pos[2];
            
            invMass[i] = 1.0 / masses[i-1];
        }
        // console.log("pendulum");
        // console.log(numParticles);
        // console.log(invMass);
        // console.log(positionArray);

        super({
            invMass,
            positionArray,
            prevPositionArray,
            velocityArray,
            enableCollision: false
        });
        
        
        this.lengths = lengths;
        this.constraint = new DistanceConstraint(numParticles, invMass, positionArray);
        for (let i = 0; i < numParticles; i++) {
            this.constraint.addConstraint(i, i+1);
        }

    }

    solveConstraints(dt: number): void {
        // console.log("solveConstraints pendulum");
        // console.log(this.velocityArray);
        this.constraint.solve(dt);
    }

    update(): void {
        // console.log("update pendulum");
        // this.#geometry.attributes.position.needsUpdate = true;
        // this.#geometry.computeVertexNormals();
    }

}