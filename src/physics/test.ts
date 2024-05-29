import { PBDObject } from "./PBDObject";
import { Constraint, DistanceConstraint } from "./constraint";

export class TestBall extends PBDObject {

    constraints: Constraint[] = [];

    constructor([x, y, z]: [number, number, number]) {
        const invMass = new Float32Array(2).fill(1);
        const positionArray = new Float32Array([x, y, z, x + 1, y + 1, z]);
        const prevPositionArray = new Float32Array(positionArray.length);
        const velocityArray = new Float32Array(positionArray.length).fill(0);
        super({
            invMass,
            prevPositionArray,
            positionArray,
            velocityArray,
            enableCollision: true,
        })

        const stretchConstraints = new DistanceConstraint(1, invMass, positionArray);
        stretchConstraints.addConstraint(0, 1);
        stretchConstraints.suffle();
        this.constraints.push(stretchConstraints);
    }

    update(): void {
        // console.log(this.positionArray[4]-this.positionArray[1])
    }

    solveConstraints(dt: number): void {
        for (let constraint of this.constraints) {
            constraint.solve(dt);
        }
    }
}
