import { BufferAttribute, BufferGeometry } from "three";
import { PBDObject } from "./PBDObject";

type Model = {
    verts: number[];
    tetIds: number[];
    tetEdgeIds: number[];
    tetSurfaceTriIds: number[];
}


export class SoftBody extends PBDObject {

    #geometry: BufferGeometry;
    get geometry() {
        return this.#geometry;
    }


    constructor(model: Model) {

        const positionArray = new Float32Array(model.verts);
        const numParticles = model.verts.length / 3;
        const invMass = new Float32Array(numParticles).fill(1);
        const prevPositionArray = new Float32Array(numParticles * 3);
        const velocityArray = new Float32Array(numParticles * 3).fill(0);

        super({
            invMass,
            positionArray,
            prevPositionArray,
            velocityArray,
            enableCollision: false
        });

        this.#geometry = new BufferGeometry();
        this.#geometry.setAttribute("position", new BufferAttribute(positionArray, 3));
        this.#geometry.setIndex(model.tetSurfaceTriIds);
        this.#geometry.computeVertexNormals();

    }

    solveConstraints(): void {

    }

    update(): void {
        this.#geometry.attributes.position.needsUpdate = true;
        this.#geometry.computeVertexNormals();
    }


}