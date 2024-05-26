

export let flag=false;

export function assert(pred: boolean, msg: string) {
    if (!pred){
 flag=true;
 throw new Error(msg);
    }
}

