import { BufferAttribute, BufferGeometry } from "three";
import { PBDObject, PBDObjectDefaults, PBDObjectOptions } from "./PBDObject";
import { getTetVolume, vecAt, vecCopy } from "../vecUtils";
import { DistanceConstraint, VolumeConstraint } from "./constraint";
import { assert } from "../utils";
import { Vector3 } from "@react-three/fiber";
import * as THREE from "three";

type Model = {
    verts: number[];
    tetIds: number[];
    tetEdgeIds: number[];
    tetSurfaceTriIds: number[];
}

export type SoftBodyOptions = {
    initialPosition?: THREE.Vector3;
    initialEuler?: THREE.Vector3;
    edgeCompliance?: number;
    volCompliance?: number;
}

export class SoftBody extends PBDObject {

    #geometry: BufferGeometry;
    get geometry() {
        return this.#geometry;
    }

    // SoftBody properties
    numTets: number;
    tetIds: number[];
    edgeIds: number[];

    grabId: number;
    grabInvMass: number;

    edgeConstraint: DistanceConstraint;
    volConstraint: VolumeConstraint;

    constructor(model: Model, options: SoftBodyOptions & PBDObjectOptions = PBDObjectDefaults) {
        const { edgeCompliance = 100.0, volCompliance = 0.0, ...pbdOptions } = options;

        const positionArray = new Float32Array(model.verts);
        const numParticles = model.verts.length / 3;
        const invMass = new Float32Array(numParticles).fill(1);
        const prevPositionArray = new Float32Array(numParticles * 3);
        const velocityArray = new Float32Array(numParticles * 3).fill(0);

        const { initialPosition, initialEuler } = options;
        const obj = new THREE.Object3D();
        if (initialPosition) obj.position.copy(initialPosition);
        if (initialEuler) obj.rotation.set(initialEuler.x, initialEuler.y, initialEuler.z);
        for (let i = 0; i < numParticles; i++) {
            vecCopy(positionArray, i, obj.localToWorld(new THREE.Vector3().fromArray(vecAt(positionArray, i))));
        }


        super({
            invMass,
            positionArray,
            prevPositionArray,
            velocityArray,
            // enableCollision: false
            ...pbdOptions
        });




        // soft body properties

        this.numTets = model.tetIds.length / 4;
        this.tetIds = model.tetIds;
        this.edgeIds = model.tetEdgeIds;

        this.grabId = -1;
        this.grabInvMass = 0.0;


        this.edgeConstraint = new DistanceConstraint(this.edgeIds.length, this.invMass, this.positionArray);
        for (let i = 0; i < this.edgeIds.length; i += 2) {
            const id0 = this.edgeIds[2 * i];
            const id1 = this.edgeIds[2 * i + 1];
            this.edgeConstraint.addConstraint(id0, id1);
        }

        this.volConstraint = new VolumeConstraint(this.numTets, volCompliance, this.invMass, this.positionArray);
        for (let i = 0; i < this.numTets; i++) {
            const vol = getTetVolume(i, this.tetIds, this.positionArray);
            this.volConstraint.addConstraint(this.tetIds[4 * i], this.tetIds[4 * i + 1], this.tetIds[4 * i + 2], this.tetIds[4 * i + 3], vol);
            const pInvMass = vol > 0.0 ? 1.0 / (vol / 4.0) : 0.0;
            // pInvMass /= 1000000.0;
            this.invMass[this.tetIds[4 * i]] += pInvMass;
            this.invMass[this.tetIds[4 * i + 1]] += pInvMass;
            this.invMass[this.tetIds[4 * i + 2]] += pInvMass;
            this.invMass[this.tetIds[4 * i + 3]] += pInvMass;
        }

        this.#geometry = new BufferGeometry();
        this.#geometry.setAttribute("position", new BufferAttribute(positionArray, 3));
        this.#geometry.setIndex(model.tetSurfaceTriIds);
        this.#geometry.computeVertexNormals();
        this.#geometry.computeBoundingBox();

    }

    solveConstraints(dt: number): void {
        this.edgeConstraint.solve(dt);
        this.volConstraint.solve(dt);

        // console.log(this.positionArray);
        // for (let x of this.positionArray) {
        // assert(Math.abs(x) < 10.0, "NaN in softbody positionArray"+this.positionArray);
        // }/
    }

    update(): void {
        this.#geometry.attributes.position.needsUpdate = true;
        this.#geometry.computeVertexNormals();
        this.#geometry.computeBoundingBox();
        this.#geometry.computeBoundingSphere();
    }


}