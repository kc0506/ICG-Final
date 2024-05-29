import { create } from "zustand"

type UpdateMode = 'auto' | 'manual';

const initialUpdateMode: UpdateMode = localStorage.getItem('mode') as UpdateMode || 'auto';

type Store = {
    mode: UpdateMode,
    changeMode: (mode: UpdateMode) => void
}

export const useUpdateMode = create<Store>((set) => ({
    mode: initialUpdateMode,
    changeMode: (mode: UpdateMode) => set({ mode }),
}))

