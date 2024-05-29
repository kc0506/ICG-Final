import { usePBDObject } from "./hooks"


import * as Physics from './physics';
import bunnyModel from './bunny.json';
import { forwardRef, useImperativeHandle } from "react";

const SoftBody = forwardRef<Physics.SoftBody>(function ({ }, ref) {

    const [bunny, remount] = usePBDObject(
        Physics.SoftBody,
        bunnyModel,
        { enableCollision: false }
    )

    useImperativeHandle(ref, () => {
        return bunny;
    });

    return <>
        <mesh geometry={bunny.geometry} position={[0, 1, 0]}>
            <meshPhongMaterial color={0xff0000} />
        </mesh>
    </>

});
export default SoftBody;