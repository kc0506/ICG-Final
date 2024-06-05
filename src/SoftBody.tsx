import { usePBDObject } from "./hooks"


import * as Physics from './physics';
import bunnyModel from './bunny.json';
import { forwardRef, useImperativeHandle } from "react";
import { useDraggable } from "./useDraggable";

type Props = Partial<Physics.SoftBodyOptions>;

const SoftBody = forwardRef<Physics.SoftBody, Props>(function (props: Props, ref) {

    const [bunny] = usePBDObject(
        Physics.SoftBody,
        bunnyModel,
        { enableCollision: false, ...props }
    )

    useImperativeHandle(ref, () => {
        return bunny;
    });

    const bind = useDraggable({ id: bunny.id });

    return <>
        <mesh {...bind} geometry={bunny.geometry} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial metalness={0.5} color={0x0000ff} />
        </mesh>
    </>

});
export default SoftBody;