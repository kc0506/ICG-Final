import { create } from "zustand";

type UpdateMode = 'auto' | 'manual';

const initialUpdateMode: UpdateMode = localStorage.getItem('mode') as UpdateMode || 'auto';

type Store = {
    mode: UpdateMode,
    changeMode: (mode: UpdateMode) => void
    isHover: boolean,
    updateHover: (isHover: boolean) => void,
}

export const useGlobalStore = create<Store>((set) => ({
    mode: initialUpdateMode,
    changeMode: (mode: UpdateMode) => set({ mode }),
    isHover: false,
    updateHover: (isHover: boolean) => set({ isHover }),
}))

type UpdateShowWire = 'body' | 'wire';

const initialShowWire: UpdateShowWire = localStorage.getItem('wireframe') as UpdateShowWire || 'body';

type StoreWire = {
    wireframe: UpdateShowWire,
    changeWire: (mode: UpdateShowWire) => void
}

export const useUpdateShowWire = create<StoreWire>((set) => ({
    wireframe: initialShowWire,
    changeWire: (mode: UpdateShowWire) => set({ wireframe: mode}),
}))
