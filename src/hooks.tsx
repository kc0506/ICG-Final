
import * as Physics from './physics'

const world = new Physics.World({ numSubsteps: 10 });

// TODO
export function useWorld() {
    return world;
}