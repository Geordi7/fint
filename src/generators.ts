
import { GeneratorOrIterator } from './types';

// get the iterator for an iterable
export const iter = <T>(g: Iterable<T>): Iterator<T> => g[Symbol.iterator]();

// get the next item from a generator or a failure value if it's finished
export const next = <T,F = undefined>(g: GeneratorOrIterator<T>, fail?: F): T | F => {
    const n = g.next()
    return n.done ? fail as F : n.value;
}

// collect all remaining values from a generator into an array
export const collect = <T>(g: GeneratorOrIterator<T>): T[] => {
    const r = [] as T[];
    while(true) {
        const n = g.next();
        if (n.done)
            return r;
        else
            r.push(n.value);
    }
}

// count upwards indefinitely
export const count: () => Generator<number> =
    function*() {let i = 0; while(true) {yield i++;}}

// count from zero to (n - 1)
export const index: (n: number) => Generator<number> =
    function*(n: number) {let i = 0; while(i < n) {yield i++;}}

// repeat a value indefinitely
export function * repeat<T>(t: T) {
    while (true) yield t;
}

// step through a range
// will automatically step negatively if the end is less than the start
//
// (end) => 0 to end by 1s
// (start, end) => start to end by 1s
// (start, end, step) => start to end by steps
//
// if step is specified and has the wrong sign, no values are produced
export const range:
    & ((end: number) => Generator<number, void, void>)
    & ((start: number, end: number) => Generator<number, void, void>)
    & ((start: number, end: number, step: number) => Generator<number, void, void>)
= function*(startend: number, end?: number, step?: number): Generator<number, void, void> {
    let start = startend;
    if (end === undefined) {
        start = 0;
        end = startend;
        step = (start <= end) ? 1 : -1;
    } else if (step === undefined) {
        step = (start <= end) ? 1 : -1;
    }

    let i = start;
    while(Math.sign(end - i) == Math.sign(step)) {
        yield i;
        i += step;
    }
}

import {Zippable, ZipType} from './types';

// generate the zipped sequence of a set of iterables
export const zip:
    <Q extends Zippable> (...args: Q) => Generator<ZipType<Q>, void, void>
= function*<Q extends Zippable>(...args: Q) {
    const gen = args.map(a => ('next' in a && typeof a.next === 'function') ?
        a : (a as unknown[])[Symbol.iterator]());

    while (true) {
        const next = gen.map(g => g.next());
        if (next.every(n => (n.done === true)))
            yield next.map(n => n.value) as any;
        else
            break;
    }
}

export const seq = function*<T>(...args: GeneratorOrIterator<T>[]): Generator<T> {
    while (args.length > 0) {
        const n = args[0].next();
        if(n.done)
            args.unshift();
        else
            yield n.value;
    }
}
