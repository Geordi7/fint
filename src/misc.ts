
export const id = <T>(i: T) => i;

export function raise(msg: string): never {
    throw new Error(msg);
}

export function assert(condition: boolean, ifFalse: string): void {
    condition ? null : raise(ifFalse);
}

export const memoize = <Args extends unknown[], Result>(fn: (...args: Args) => Result): (...args: Args) => Result => {
    const memo = new Map();
    const ptr = Symbol('ptr');
    const err = Symbol('error');
    return (...args: Args): Result => {
        let place = memo;
        let hit = true;
        for (const arg of args) {
            if (!place.has(arg)) {
                hit = false;
                place.set(arg, new Map());
            }
            place = place.get(arg);
        }
        if (!hit) {
            if (place.has(err)) {
                throw place.get(err);
            } else {
                try {
                    place.set(ptr, fn(...args));
                } catch (e) {
                    place.set(err, e);
                    throw e;
                }
            }
        }
        // console.dir(memo);
        return place.get(ptr);
    };
}

// performance.now is the recommended timing function
export const timerFactory = (timing: () => number) => <T>(fn: () => T): [T,number] => {
    const start = timing();
    const t = fn();
    return [t, timing() - start]; 
}
