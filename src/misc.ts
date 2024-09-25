
export const id = <T>(i: T) => i;
export const identity = id;

// equivalent to (s => {throw new Error(s)})('message')
export function raise(msg: string): never {
    throw new Error(msg);
}

// if condition is false throw an error with the associated message
export function assert(condition: boolean, ifFalse: string): void {
    condition ? null : raise(ifFalse);
}

// produce a memoized version of a function
// the function should be pure
// it will not be called more than once for a given input
export const memoize = <Args extends unknown[], Output>(fn: (...args: Args) => Output): (...args: Args) => Output => {
    const memo = new Map();
    const ptr = Symbol('ptr');
    const err = Symbol('error');
    return (...args: Args): Output => {
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
// usage:
// const timedFn = timerFactory(performance.now)(fn);
export const timerFactory = (timing: () => number) => <T>(fn: () => T): [T,number] => {
    const start = timing();
    const t = fn();
    return [t, timing() - start]; 
}
