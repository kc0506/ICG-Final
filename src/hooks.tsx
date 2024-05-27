
import { useMemo, useRef, useState } from 'react';
import * as Physics from './physics';

const world = new Physics.World({ numSubsteps: 50 });

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

    const ref = useRef<P | null>(null);
    const pbdObject = useMemo(() => {
        console.log('memo')
        if (ref.current) {
            world.remove(ref.current);
        }
        const obj = new pbdObjectClass(...args);
        world.add(obj);
        return obj;
    }, [counter])
    ref.current = pbdObject;

    return [pbdObject, () => setCounter(counter + 1)];
}

