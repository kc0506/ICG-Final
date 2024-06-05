import { usePBDObject } from "./hooks"


import * as Physics from './physics';
import bunnyModel from './bunny.json';
import { forwardRef, useImperativeHandle } from "react";
import { useUpdateShowWire } from "./store";


const SoftBody = forwardRef<Physics.SoftBody>(function ({ }, ref) {
    const { wireframe } = useUpdateShowWire();
    
    const [bunny, remount] = usePBDObject(
        Physics.SoftBody,
        bunnyModel,
        { enableCollision: false }
    )

    useImperativeHandle(ref, () => {
        return bunny;
    });

    return <>
        <mesh geometry={bunny.geometry} position={[0, 0, 0]}>
            <meshPhongMaterial color={0x0000ff} wireframe={wireframe==='wire'} />
        </mesh>
    </>

});
export default SoftBody;