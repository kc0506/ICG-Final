import { usePBDObject } from "./hooks"


import * as Physics from './physics';
import bunnyModel from './bunny.json';

export default function SoftBody() {

    const [bunny, remount] = usePBDObject(Physics.SoftBody, bunnyModel)

    return <>
        <mesh geometry={bunny.geometry}>
            <meshPhongMaterial color={0xff0000} />
        </mesh>
    </>


}