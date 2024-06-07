
import { Vector3 } from "three";
import { assert } from "../utils";

export type PBDObjectProps = {
    invMass: Float32Array;
    prevPositionArray: Float32Array;
    positionArray: Float32Array;
    velocityArray: Float32Array;

} & PBDObjectOptions;

export type PBDObjectOptions = {
    enableCollision?: boolean;
};

export const PBDObjectDefaults: PBDObjectOptions = {
    enableCollision: false,
};

let id = 0;

export class PBDObject {
    id: number;
    invMass: Float32Array;
    prevPositionArray: Float32Array;
    positionArray: Float32Array;
    velocityArray: Float32Array;

    // todo
    parentPosition: Vector3;
    parentVelocity: Vector3;


    initialPositionArray: Float32Array;
    initialVelocityArray: Float32Array;

    enableCollision;
    constructor({
        invMass,
        prevPositionArray,
        positionArray,
        velocityArray,

        enableCollision,
    }: PBDObjectProps) {
        this.id = id++;
        this.enableCollision = enableCollision;

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

        this.initialPositionArray = new Float32Array(positionArray);
        this.initialVelocityArray = new Float32Array(velocityArray);
    }

    get numParticles() {
        return Math.floor(this.positionArray.length / 3);
    }

    solveConstraints(dt: number) {
        throw new Error("Method not implemented.");
    }
    update() {
        throw new Error("Method not implemented.");
    }

    reset() {
        this.positionArray.set(this.initialPositionArray);
        this.velocityArray.set(this.initialVelocityArray);
    }
}
