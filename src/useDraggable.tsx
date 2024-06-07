import { GroupProps, MeshProps } from "@react-three/fiber";
import { World } from "./physics";
import { useGlobalStore } from "./store";
import { useWindowSize } from "usehooks-ts";
import { useWorld } from "./hooks";

type Props = {
    // world: World;
    id: number;
}
export function useDraggable({ id }: Props): Partial<GroupProps & MeshProps> {
    const world = useWorld();
    const { updateHover } = useGlobalStore();

    return {
        onPointerDown:
            (e) => {
                e.stopPropagation();
                world.startDrag(e.ray, e.distance, id)
            },
        onPointerUp:
            e => {
                e.stopPropagation();
                world.endDrag();
            },
        onPointerEnter: e => { console.log('hover'), updateHover(true) },
        onPointerLeave: e => { updateHover(false) },
    }
}