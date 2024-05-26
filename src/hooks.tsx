
import { useMemo, useState } from 'react';
import * as Physics from './physics';

const world = new Physics.World({ numSubsteps: 10 });

// TODO
export function useWorld() {
    return world;
}

type Constructor<T> = {
    new(...args: any[]): T;
}

export function usePBDObject<P extends Physics.PBDObject, Args extends any[]>(pbdObjectClass: new (...args: Args) => P, ...args: Args): [P, () => void] {
    // for manually remount
    const [counter, setCounter] = useState(0);

    const pbdObject = useMemo(() => {
        return new pbdObjectClass(...args);
    }, [counter]);

    return [pbdObject, () => setCounter(counter + 1)];
}

