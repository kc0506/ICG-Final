import { usePBDObject } from "./hooks";


import { forwardRef, useImperativeHandle } from "react";
import bunnyModel from './bunny.json';
import * as Physics from './physics';
import { useUpdateShowWire } from "./store";
import { useDraggable } from "./useDraggable";

type Props = Partial<Physics.SoftBodyOptions>;

const SoftBody = forwardRef<Physics.SoftBody, Props>(function (props: Props, ref) {

    const { wireframe } = useUpdateShowWire();

    const [bunny ] = usePBDObject(
        Physics.SoftBody,
        bunnyModel,
        { enableCollision: false, ...props , volCompliance: 100}
    )

    useImperativeHandle(ref, () => {
        return bunny;
    });

    const bind = useDraggable({ id: bunny.id });

    return <>
        <mesh {...bind} geometry={bunny.geometry} position={[0, 0, 0]} castShadow receiveShadow>
            <meshPhongMaterial shininess={1000} reflectivity={10} color={0x0000ff} wireframe={wireframe === 'wire'} />
        </mesh>
    </>

});
export default SoftBody;