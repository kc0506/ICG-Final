

export let assertionFail = false;

export function assert(pred: boolean, msg?: string) {
    if (!pred) {
        assertionFail = true;
        throw new Error(msg);
    }
}

