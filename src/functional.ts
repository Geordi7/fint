
// produce an array of own keys of an object
export const keys: <T>(o: T) => (keyof T)[] = Object.keys;

import * as gen from './generators';

const defSingleValue = <T>(a: T) => (a as any);
const defDoubleValue = <T,K>(a: T, k: K) => ([a,k] as any);

export const map = {
    a<V,U=V>(a: V[], fn: (v: V, i: number, a: V[]) => U = defSingleValue): U[] {
        return a.map(fn);
    },
    
    ag: function*<V,U=V>(a: V[], fn: (v: V, i: number, a: V[]) => U = defSingleValue): Generator<U> {
        let i = 0;
        for (const v of a) {
            yield fn(v,i,a);
            i += 1;
        }
    },

    ar<V,K extends PropertyKey, U=V>
    (a: V[], fn: (v: V, i: number, a: V[]) => [K,U] | null = defDoubleValue): Record<K,U> {
        let i = 0;
        const r = {} as Record<K,U>;
        for (const v of a) {
            const u = fn(v,i,a);
            if (u !== null)
                r[u[0]] = u[1];
        }
        return r;
    },

    r<V,K extends PropertyKey, U>
    (r: Record<K,V>, fn: (v: V, k: K, o: Record<K,V>) => U): Record<K,U> {
        const z = {} as Record<K,U>;
        for (const k in r) {
            if (r.hasOwnProperty(k)) {
                z[k] = fn(r[k],k,r);
            }
        }
        return z;
    },
    
    rr<V,K extends PropertyKey,J extends PropertyKey, U>
    (r: Record<K,V>, fn: (v: V, k: K, o: Record<K,V>) => [J,U] | null): Record<J,U> {
        const z = {} as Record<J,U>;
        for (const k in r) {
            if (r.hasOwnProperty(k)) {
                const u = fn(r[k],k,r);
                if (u !== null)
                    z[u[0]] = u[1];
            }
        }
        return z;
    },

    ra<V,K extends PropertyKey, U>
    (r: Record<K,V>, fn: (v: V, k: K, o: Record<K,V>) => U): U[] {
        const a = [] as U[];
        for (const k in r) {
            if (r.hasOwnProperty(k)) {
                a.push(fn(r[k],k,r));
            }
        }
        return a;
    },

    rg: function*<V,K extends PropertyKey,U>
    (r: Record<K,V>, fn: (v: V, k: K, o: Record<K,V>) => U): Generator<U> {
        for (const k in r) {
            if (r.hasOwnProperty(k)) {
                yield(fn(r[k],k,r));
            }
        }
    },
}

// map an object, generator, or array using a function
// the output has the same structure as the input
type MagicMap = 
    & (<V,U>(host: V[], fn: (v: V, i: number, a: V[]) => U) => U[])
    & (<V,U>(host: Generator<V,any,any>, fn: (v: V, i: number) => U) => Generator<U,void,void>)
    & (<V,U>(host: IterableIterator<V>, fn: (v: V, i: number) => U) => Generator<U,void,void>)
    & (<V, K extends PropertyKey, U>(host: Record<K,V>, fn: (v: V, k: K, o: Record<K,V>) => U) => Record<K,U>)
;
export const magic: MagicMap = (host: any, fn: any): any => {
    if (Array.isArray(host)) {
        return host.map(fn);
    } else if ('next' in host && typeof host.next === 'function') {
        const counter = gen.count();
        const generator = function*(){
            for (const m of host) {
                yield fn(m, counter.next().value);
            }
        };
        return generator();
    } else {
        const r = {} as any;
        for (const key of keys(host)) {
            r[key] = fn(host[key], key, host);
        }
        return r;
    }
}

import {Zippable, ZipType} from './types';

// zip (transpose) a set of arrays or generators
export const zip:
    <Q extends Zippable> (...args: Q) => ZipType<Q>[]
= <Q extends Zippable>(...args: Q) => {
    const gen = args.map(a => ('next' in a && typeof a.next === 'function') ?
        a : (a as unknown[])[Symbol.iterator]());

    const r: unknown[][] = [];
    while (true) {
        const next = gen.map(g => g.next());
        if (next.every(n => (n.done === true)))
            r.push(next);
        else
            break;
    }

    return r as any[];
}

// transpose a matrix stored in a 1D array
export const transpose = <T> (matrix: T[], rank: number): T[] => {
    const r: T[] = [];
    for (const i of gen.range(matrix.length)) {
        const j = rank * (i % rank) + Math.floor(i / rank);
        r.push(matrix[j]);
    }
    return r;
}

type A = {t: 1, z: boolean} | {t: 2, x: number};
