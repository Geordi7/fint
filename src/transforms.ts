
import { assert } from './misc';
import {flow} from './pipes';
import { is } from './types';

export const identity = <T>(t: T): T => t;

export const inspect = <V>(fn: (v: V) => unknown) => <U extends V>(v: U): U => (fn(v), v);

export const rec = ({
    k: Object.keys as <K extends PropertyKey>(record: Record<K,unknown>) => K[],
    v: Object.values as <V>(r: Record<PropertyKey, V>) => V[],
    e: Object.entries as <K extends PropertyKey, V>(r: Record<K, V>) => [K, V][],
    f: Object.fromEntries as <K extends PropertyKey, V>(a: Iterable<[K, V]>) => Record<K,V>,

    // point-free tools

    map: <V, U, K extends PropertyKey>(fn: (v: V, k: K) => U) =>
        (record: Record<K,V>): Record<K,U> =>
            rec.e(record).reduce((l, [k,v]) => (l[k] = fn(v,k), l), {} as Record<K,U>),

    filter: (<V, K extends PropertyKey>(fn: (v: V, k: K) => boolean) =>
        (record: Record<K,V>): Record<K,V> =>
            rec.e(record).reduce((l, [k,v]) => (fn(v,k) ? l[k] = v : null, l), {} as Record<K,V>)) as
        & (<V, U extends V, K extends PropertyKey>(fn: (v: V, k: K) => v is U) => (record: Record<K,V>) => Record<K,U>)
        & (<V, K extends PropertyKey>(fn: (v: V, k: K) => boolean) => (record: Record<K,V>) => Record<K,V>),

    reduce: <V, U, K extends PropertyKey>(u: U, fn: (u: U, v: V, k: K) => U) =>
        (record: Record<K, V>): U => rec.e(record).reduce((u, [k,v]) => fn(u,v,k), u),

    inspect: <V>(fn: (v: V) => void) =>
        <R extends Record<PropertyKey,V>> (record: R): R =>
            (rec.v(record).forEach(fn), record),

    every: <V, K extends PropertyKey>(fn: (v: V, k: K) => boolean) => (record: Record<K,V>): boolean => {
        for (const [k,v] of rec.e(record)) {
            if (!fn(v,k)) return false;
        }
        return true;
    },

    some: <V, K extends PropertyKey>(fn: (v: V, k: K) => boolean) => (record: Record<K,V>): boolean => {
        for (const [k,v] of rec.e(record)) {
            if (fn(v,k)) return true;
        }
        return false;
    },

    // take a set of keys and a function and create a record with them
    fromKeys: <K extends PropertyKey,V>(fn: (k: K) => V) => (keys: Iterable<K>): Record<K,V> =>
        rec.f(flow(keys,
            iter.map(k => [k, fn(k)] as [K,V]),
            iter.filter(([_,v]) => !is.undefined(v)))),
});

export const arr = {
    map: <V,U>(fn: (v: V, i: number) => U) =>
        (array: V[]): U[] => array.map(fn),
    filter: ((fn: (v: any, i: number) => unknown) => (a: any[]) => a.filter(fn)) as
        & (<V,U extends V>(fn: (v: V, i: number) => v is U) => (array: V[]) => U[])
        & (<V>(fn: (v: V, i: number) => boolean) => (array: V[]) => V[]),
    reduce: <V,U>(u: U, fn: (u: U, v: V, i: number) => U) =>
        (array: V[]): U => array.reduce(fn, u),
    inspect: <V>(fn: (v: V, i: number) => void) =>
        (array: V[]): V[] => (array.forEach(fn), array),
    every: <V>(fn: (v: V, i: number) => boolean) =>
        (array: V[]): boolean => array.every(fn),
    some: <V>(fn: (v: V, i: number) => boolean) =>
        (array: V[]): boolean => array.some(fn),
    sort: <V>(compare: (a: V, b: V) => number) => (array: V[]): V[] =>
        flow([...array], a => (a.sort(compare), a)),
    order: <V>(orderBy: ((v: V, i: number) => number) | ((v: V, i: number) => string)) => (array: V[]): V[] =>
        flow(array.map((v,i) => [orderBy(v,i),v] as [number, V]),
            a => a.sort(([a],[b]) => a - b),
            arr.map(e => e[1])),
    includes: <V>(item: V) => (array: V[]) => array.includes(item),
    slice: <V>(start: number, stop?: number) =>
        (array: V[]): V[] => array.slice(start, stop),
    zip: <Q extends unknown[][]>(...arrays: Q): ArrayZipType<Q>[] =>
        flow(Math.min(...arrays.map(a => a.length)),
            iter.index,
            iter.map(i => arrays.map(a => a[i])),
            iter.collect) as any[],
    flatten: <V>(array: V[][]): V[] =>
        array.flatMap(identity),
    squash: <V>(array: DeepArray<V>): V[] =>
        [...iter.deep(array as DeepIter<V>)],
    partition: <V,U>(fn: (v: V, i: number) => U) => (array: V[]): Map<U,V[]> =>
        array.reduce((m,v,i) =>
            flow(fn(v,i), x => flow(m.get(x),
                    maybe.mapElse(
                        t => (t.push(v), m),
                        () => m.set(x,[v])))),
            new Map<U,V[]>()),
    divide: <V>(n: number) => (array: V[]): [V[], V[]] =>
        [array.slice(0,n), array.slice(n)],
    chunk: <V>(n: number) => (array: V[]): V[][] => {
        const result = []
        let rest = [...array];
        while (n < rest.length) {
            rest = flow(rest,
                arr.divide(n),
                ([part,rest]) => (result.push(part), rest));
        }
        result.push(rest);
        return result;
    },
    lookup: <V, K extends PropertyKey>(fn: (v: V, i: number) => K) => (array: V[]): Record<K, V[]> =>
        array.reduce((l,v,i) => flow(fn(v,i),
            k => ({
                ...l,
                [k]: flow(l[k],
                    maybe.mapOr(x => (x.push(v), x), [v])),
            })),
        {} as Record<K, V[]>),
    product: function*<T extends unknown[][]>(...axes: T): Generator<ProductResultItem<T>,void,void> {
        if (axes.length === 0)
            return;
    
        const iters = axes.map(a => iter.ate(a));
        const front = iters.map(it => it.next());
        const top = axes.length - 1;
        let layer = top;

        while (true) {
            yield front.map(nn => nn.value) as ProductResultItem<T>;

            front[layer] = iters[layer].next();
            while (front[layer].done && layer >= 0) {
                iters[layer] = iter.ate(axes[layer]);
                front[layer] = iters[layer].next();

                layer -= 1;
                if (layer >= 0) {
                    front[layer] = iters[layer].next();
                } else {
                    return;
                }
            }

            layer = top;
        }
    },
};

export type ArrayFlatten = 
    & (<V>() => (array: DeepArray<V>) => V[])
    & (<V>(n: number) => (array: DeepArray<V>) => DeepArray<V>)
;

export type ArrayZipType<Q extends unknown[][]> = {
    [K in keyof Q]:
        Q[K] extends (infer R)[] ? R : never
};

export type DeepArray<T> = (T | DeepArray<T>)[];

export type ProductResultItem<T extends unknown[][]> =
    T extends [] ? [] :
    T extends [(infer A)[], ...infer R] ?
        R extends unknown[][] ?
            [A, ...ProductResultItem<R>] :
        never :
    never
;

export const str = {
    join: (joiner: string) => (parts: string[]): string => parts.join(joiner),
    includes: (part: string) => (s: string): boolean => s.includes(part),
    indexOf: (part: string) => (s: string): number | undefined =>
        flow(s.indexOf(part), n => n > -1 ? n : undefined),
    slice: (start: number, stop?: number) => (s: string): string => s.slice(start, stop),
    split: (separator: string | RegExp) => (s: string): string[] => s.split(separator),
};

export const iter = {
    ate: <V>(i: Iterable<V>): Iterator<V> => i[Symbol.iterator](),
    map:<V,U>(fn: (v: V) => U) => function*(i: Iterable<V>): IterableIterator<U> {
        for (const item of i) yield fn(item);
    },
    filter: (<V>(fn: (v: V) => boolean) => function*<U extends V>(i: Iterable<U>): IterableIterator<U> {
        for (const item of i)
            if (fn(item))
                yield item;
    }) as
        & (<V>(fn: (v: V) => boolean) => <U extends V>(i: Iterable<U>) => IterableIterator<U>)
        & (<V,U extends V>(fn: (v: V) => v is U) => (i: Iterable<V>) => IterableIterator<U>),
    reduce: (<V,U>(u: U, fn: (u: U, v: V) => U) => (i: Iterable<V>): U => {
        for (const item of i)
            u = fn(u,item);
        return u;
    }),
    zip: function*<Q extends Iterable<unknown>[]>(...iters: Q): IterableIterator<IterZipType<Q>> {
        const ptrs = iters.map(i => iter.ate(i));
        while(true) {
            const next = ptrs.map(i => i.next());
            if (next.some(i => i.done)) {
                return;
            } else {
                yield next.map(i => i.value) as any;
            }
        }
    },
    chain: function *<T>(...iterables: Iterable<T>[]): IterableIterator<T> {
        for (const iterable of iterables)
            yield * iterable;
    },
    take: <T>(i: Iterable<T>) => {
        const ix = iter.ate(i) as IterableIterator<T>;
        assert(Symbol.iterator in ix, 'iter.take: iterable produced Iterator instead of IterableIterator');
        const next = ix.next();
        return next.done ? undefined : {next: next.value, rest: ix};
    },
    step: <T>(step: (t: T) => void) => (g: IterableIterator<T>): boolean =>
        flow(g.next(), n => n.done ? false : (step(n.value), true)),
    collect: <T>(i: Iterable<T>): T[] => {
        return [...i] as T[];
    },
    enumerate: function*<T>(i: Iterable<T>): IterableIterator<[number,T]> {
        yield * iter.zip(iter.count(), i);
    },
    count: function*(): Generator<number, never, void> {
        let i=0; while(true) yield i++;
    },
    index: function*(n: number): Generator<number, void, void> {
        let i = 0; while (i<n) yield i++;
    },
    deep: function*<T>(src: DeepIter<T>): IterableIterator<T> {
        const stack = [iter.ate(src)];
        while (stack.length) {
            const next = stack[stack.length-1].next();
            if (next.done) {
                stack.pop();
            } else {
                const i = next.value as DeepIter<T>;
                if (Symbol.iterator in i) {
                    stack.push(iter.ate(i));
                } else {
                    yield next.value as T;
                }
            }
        }
    },
    
    // step through a range
    // will automatically step negatively if the end is less than the start
    //
    // (end) => 0 to end by 1s
    // (start, end) => start to end by 1s
    // (start, end, step) => start to end by steps
    //
    // if step is specified and has the wrong sign, no values are produced
    range: (function*(startend: number, end?: number, step?: number): Generator<number, void, void> {
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
    }) as
    & ((end: number) => Generator<number, void, void>)
    & ((start: number, end: number) => Generator<number, void, void>)
    & ((start: number, end: number, step: number) => Generator<number, void, void>),

    repeat: function*<T>(t: T): Generator<T, never, void> {
        while(true) yield t;
    },

    aperture: <V>(n: number) => function*(i: Iterable<V>): Generator<V[], void, void> {
        const ap = [] as V[];
        for(const item of i) {
            ap.push(item);
            if (ap.length > n) {
                ap.shift();
                yield [...ap];
            }
        }
    },
};

export type IterZipType<Q extends Iterable<unknown>[]> = {
    [k in keyof Q]:
        Q[k] extends Iterable<infer T> ? T :
        never
}

export type DeepIter<T> = Iterable<T | DeepIter<T>>;

export const maybe = {
    map: <V,U>(fn: (v: V) => U) => (thing: V | undefined | null): U | undefined =>
        thing == undefined ? undefined : fn(thing),
    mapElse: <V,U>(map: (v: V) => U, orElse: () => U) => (thing: V | undefined | null) : U =>
        thing == undefined ? orElse() : map(thing),
    mapOr: <V,U>(map: (v: V) => U, or: U) => (thing: V | undefined | null) : U =>
        thing == undefined ? or : map(thing),
    or: <U>(u: U) => <V>(thing: V | undefined | null) : V | U =>
        thing ?? u,
    orElse: <U>(fn: () => U) => <V>(thing: V | undefined | null) : V | U =>
        thing ?? fn(),
}

export const set = {
    union: <T>(...sets: Iterable<T>[]): Set<T> => {
        return new Set(iter.chain(...sets));
    },
    intersect: <T>(...collections: Iterable<T>[]): Set<T> => {
        const sets = collections.map(c =>
            c instanceof Set ? c : new Set(c));
        const [head, ...tail] = sets;

        const result = new Set(head);
        for (const item of head) {
            for (const s of tail) {
                if (!s.has(item)) {
                    result.delete(item);
                    break;
                }
            }
        }
        return result;
    },
}

export const obj = {
    pick: <T, K extends keyof T>(...k: K[]) => (t: T): Pick<T,K> =>
        k.reduce((p, kk) => (p[kk] = t[kk], p), {} as Pick<T,K>),
    omit: <T, K extends keyof T>(...k: K[]) => (t: T): Omit<T,K> =>
        k.reduce((p, kk) => {delete (p as T)[kk]; return p}, {...t} as Omit<T,K>),
}
