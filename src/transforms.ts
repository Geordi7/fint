
import { assert, identity } from './misc';
import { flow } from './pipes';
import { is, KeysAcrossUnion, Maybe, PrettyIntersection, PropsAcrossUnion, Scalar, Tree } from './types';

export const inspect = <V>(fn: (v: V) => unknown) => <U extends V>(v: U): U => (fn(v), v);

export const rec = ({
    k: Object.keys as <K extends string>(record: Record<K,unknown>) => K[],
    v: Object.values as <V>(r: Record<string, V>) => V[],
    e: Object.entries as <K extends string, V>(r: Record<K, V>) => [K, V][],
    f: Object.fromEntries as <K extends string, V>(a: Iterable<[K, V]>) => Record<K,V>,

    // point-free tools

    map: <V, U, K extends string>(fn: (v: V, k: K) => U) =>
        (record: Record<K,V>): Record<K,U> =>
            rec.e(record).reduce((l, [k,v]) => (l[k] = fn(v,k), l), {} as Record<K,U>),

    filter: (<V, K extends string>(fn: (v: V, k: K) => boolean) =>
        (record: Record<K,V>): Record<K,V> =>
            rec.e(record).reduce((l, [k,v]) => (fn(v,k) ? l[k] = v : null, l), {} as Record<K,V>)) as
        & (<V, U extends V, K extends string>(fn: (v: V, k: K) => v is U) => (record: Record<K,V>) => Record<K,U>)
        & (<V, K extends string>(fn: (v: V, k: K) => boolean) => (record: Record<K,V>) => Record<K,V>),

    reduce: <V, U, K extends string>(u: U, fn: (u: U, v: V, k: K) => U) =>
        (record: Record<K, V>): U => rec.e(record).reduce((u, [k,v]) => fn(u,v,k), u),

    inspect: <V>(fn: (v: V) => void) =>
        <R extends Record<string,V>> (record: R): R =>
            (rec.v(record).forEach(fn), record),

    every: <V, K extends string>(fn: (v: V, k: K) => boolean) => (record: Record<K,V>): boolean => {
        for (const [k,v] of rec.e(record)) {
            if (!fn(v,k)) return false;
        }
        return true;
    },

    some: <V, K extends string>(fn: (v: V, k: K) => boolean) => (record: Record<K,V>): boolean => {
        for (const [k,v] of rec.e(record)) {
            if (fn(v,k)) return true;
        }
        return false;
    },

    // take a set of keys and a function and create a record with them
    fromKeys: <K extends string,V>(fn: (k: K) => V) => (keys: Iterable<K>): Record<K,V> =>
        rec.f(flow(keys,
            iter.map(k => [k, fn(k)] as [K,V]),
            iter.filter(([_,v]) => !is.undefined(v))))
});

export const arr = {
    from: <V>(i: Iterable<V>) => [...i],

    of: <V>(v: V, n: number) => [...iter.repeatn(n)(v)],

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
        (a => (a.sort(compare), a))([...array]),

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
        array.reduce((m,v,i) => {
            const key = fn(v,i);
            m.set(key, [...m.get(key) ?? [], v]);
            return m;
        }, new Map<U,V[]>()),

    divide: (n: number) => <V>(array: V[]): [V[], V[]] =>
        [array.slice(0,n), array.slice(n)],

    chunk: (n: number) => <V>(iterable: Iterable<V>): V[][] => {
        const result: V[][] = [];
        let next: V[] = [];
        for (const item of iterable) {
            if (next.length >= n) {
                result.push(next);
                next = [];
            }
            next.push(item);
        }
        if (next.length > 0)
            result.push(next);
        return result;
    },

    lookup: <V, K extends PropertyKey>(fn: (v: V, i: number) => K) => (array: V[]): Record<K, V[]> =>
        array.reduce((l,v,i) => {
            const key = fn(v,i);
            return {...l, [key]: [...(l[key] ?? []), v]};
        }, {} as Record<K, V[]>),

    product: function*<T extends unknown[][]>(...axes: T): IterableIterator<ProductResultItem<T>> {
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
        (n => n > -1 ? n : undefined)(s.indexOf(part)),

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

    slice: ((a: number, b?: number) => function*<T>(i: Iterable<T>): IterableIterator<T> {
        if (is.nullish(b)) {
            for (const next of i) {
                if (a-- > 0) yield next;
                else return;
            }
        } else {
            let n = b - a;
            for (const next of i) {
                if (a-- > 0) {}
                else if (n-- > 0) yield next;
                else return;
            }
        }
    }) as
        & ((end: number) => <T>(i: Iterable<T>) => IterableIterator<T>)
        & ((start: number, end: number) => <T>(i: Iterable<T>) => IterableIterator<T>)
    ,
    
    // apply this function to the next item in the iterator
    // return false if there was nothing to apply to
    step: <T>(fn: (t: T) => void) => (g: IterableIterator<T>): boolean => {
        const n = g.next();
        if (n.done) {
            fn(n.value);
            return true;
        } else {
            return false;
        }
    },
    
    collect: <T>(i: Iterable<T>): T[] => {
        return [...i] as T[];
    },
    
    enumerate: function*<T>(i: Iterable<T>): IterableIterator<[number,T]> {
        yield * iter.zip(iter.count(), i);
    },
    
    count: function*(): IterableIterator<number> {
        let i=0; while(true) yield i++;
    },
    
    index: function*(n: number): IterableIterator<number> {
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
    range: (function*(startend: number, end?: number, step?: number): IterableIterator<number> {
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
    & ((end: number) => IterableIterator<number>)
    & ((start: number, end: number) => IterableIterator<number>)
    & ((start: number, end: number, step: number) => IterableIterator<number>),

    repeat: function*<T>(t: T): IterableIterator<T> {
        while(true) yield t;
    },

    repeatn: (n: number) => function*<T>(t: T): IterableIterator<T> {
        while(n-- > 0) yield t;
    },

    loop: function*<T>(i: Iterable<T>): IterableIterator<T> {
        while(true) yield* i;
    },

    chunk: (n: number) => function*<V>(i: Iterable<V>): IterableIterator<V[]> {
        let c = [] as V[];
        for (const item of i) {
            c.push(item);
            if (c.length === n) {
                yield c;
                c = [];
            }
        }
        if (c.length > 0) {
            yield c;
        }
    },

    // take an iterable
    // generate arrays of n-item subsequences of the iterable in order
    aperture: (n: number) => function*<V>(i: Iterable<V>): IterableIterator<V[]> {
        const ap = [] as V[];
        for(const item of i) {
            ap.push(item);
            if (ap.length === n) {
                yield [...ap];
                ap.shift();
            }
        }
    },

    // take an iterable
    // generate arrays of n-item subsequences of the iterable in order
    // include windows 'off the ends' of the input, extended with nulls
    apertureExt: (n: number) => function*<V>(i: Iterable<V>): IterableIterator<(null | V)[]> {
        yield * flow(iter.chain(
                iter.repeatn(n-1)(null),
                i,
                iter.repeatn(n-1)(null)
            ) as Iterable<null | V>,
            iter.aperture(n));
    },

    include: <V>(keep: Iterable<V>) => function*(i: Iterable<V>): IterableIterator<V> {
        const d = keep instanceof Set ? keep : new Set(keep);
        for (const item of i) {
            if (d.has(item))
                yield item;
        }
    },

    exclude: <V>(discard: Iterable<V>) => function*(i: Iterable<V>): IterableIterator<V> {
        const d = discard instanceof Set ? discard : new Set(discard);
        for (const item of i) {
            if (!d.has(item))
                yield item;
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
    map: <V,U>(fn: (v: V) => U) => <T extends V>(thing: Maybe<T>): U | undefined =>
        thing == undefined ? undefined : fn(thing),

    mapElse: <V,U>(map: (v: V) => U, orElse: () => U) => <T extends V>(thing: Maybe<T>): U =>
        thing == undefined ? orElse() : map(thing),

    mapOr: <V,U>(map: (v: V) => U, or: U) => (thing: V | null | undefined): U =>
        thing == undefined ? or : map(thing),

    or: <U>(u: U) => <V>(thing: Maybe<V>) : V | U =>
        thing ?? u,

    orElse: <U>(fn: () => U) => <V>(thing: Maybe<V>) : V | U =>
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
    difference: <T>(source: Iterable<T>, discard: Iterable<T>): Set<T> => {
        const setDiscard = discard instanceof Set ? discard : new Set(discard);
        const result = new Set<T>();
        for (const item of source) {
            if (!setDiscard.has(item))
                result.add(item);
        }
        return result;
    }
}

export const obj = {
    pick: <K extends PropertyKey>(...k: K[]) => <T extends {[k in K]: unknown}>(t: T): Pick<T,K> =>
        k.reduce((p, kk) => (p[kk] = t[kk], p), {} as Pick<T,K>),
    omit: <K extends PropertyKey>(...k: K[]) => <T extends {[k in K]: unknown}>(t: T): Omit<T,K> =>
        k.reduce((p, kk) => {delete (p as T)[kk]; return p}, {...t} as Omit<T,K>),
}

// point free tools for discriminated unions
export const union = {
    dispatch: <
        const X extends string,
        Q extends {[K in X]: string},
        const M extends DispatchOver<X,Q>>
    (discriminant: X, dispatcher: M) =>
    (item: Q): ReturnsFromProps<M> => dispatch(discriminant, item, dispatcher),

    match: <
        Q extends {[X in string]: unknown},
        const D extends MatchOver<Q>>
    (matcher: D) =>
    (item: Q): ReturnsFromProps<D> => match(item, matcher),
};

export function match<Q extends {[X in string]: unknown}, const D extends MatchOver<Q>>
(item: Q, matcher: D): ReturnsFromProps<D> {
    const keys = Object.keys(matcher) as (keyof D)[];
    
    for (const k of keys) {
        if (k in item) {
            return (matcher[k] as any)(item);
        }
    }

    throw new Error(`could not match variant with keys [${Object.keys(item).join(',')}] with matcher with keys [${Object.keys(matcher).join(',')}]`);
};

export type MatchOver<Q> = {[K in KeysAcrossUnion<Q>]?: (variant: MatchVariantFor<Q,K>) => unknown};

export type MatchVariantFor<T,K extends string> = T extends {[XK in (infer KK extends K)]: unknown} ?
    PrettyIntersection<T & {[KKK in KK]: T[KK]}> : never;

export type ReturnsFromProps<T> = PropsAcrossUnion<T> extends (arg: never) => infer R ? R : never;

export function dispatch<
    const X extends string,
    Q extends {[K in X]: string},
    const M extends DispatchOver<X,Q>>
(discriminant: X, item: Q, dispatcher: M): ReturnsFromProps<M> {
    const x = item[discriminant];

    if (x in dispatcher) {
        return (dispatcher[x] as any)(item);
    }

    throw new Error(`failed to dispatch discriminant ${x} with dispatcher with keys [${Object.keys(dispatcher).join(',')}]`);
};

export type DispatchOver<X extends string, Q extends {[K in X]: string}> = {
    [K in Q[X]]?: (variant: DispatchVariantFor<X,Q,K>) => unknown
};

export type DispatchVariantFor<X extends string, Q, K> = PrettyIntersection<{[XX in X]: K} & Q>

export const tree = {
    clone: <V extends Scalar | Date | null>(t: Tree<V>): Tree<V> => {
        if (is.array(t))
            return t.map(tree.clone);
        else if (is.record(t))
            return rec.map(tree.clone)(t);
        else if (is.date(t))
            return new Date(t) as V
        else if (is.null(t))
            return null as V;
        else if (is.scalar(t))
            return t;
        else
            throw new Error('tree clone can only accept scalars, dates, and nulls at leaves');
    },

    map: <V,U>(fn: (v: V) => U) => {
        const mfn = (t: Tree<V>): Tree<U> => {
            if (is.array(t))
                return t.map(mfn);
            else if (is.record(t))
                return rec.map(mfn)(t);
            else
                return fn(t);
        }

        return (t: Tree<V>): Tree<U> => mfn(t);
    },

    // tree.prune(predicate)(tree)
    // recursively apply fn to everything in tree
    // remove values that produce false
    // if a subtree is empty after pruning then remove the subtree
    prune: <V>(predicate: (v: V) => boolean) => {
        const keep = (item: Tree<V | undefined>) =>
            is.array(item) ? item.length > 0 :
            is.record(item) ? rec.k(item).length > 0 :
            !is.undefined(item);

        const pfn = (t: Tree<V>): Tree<V | undefined> => {
            if (is.array(t)) {
                return t.map(pfn).filter(keep);
            } else if (is.record(t)) {
                return flow(t, rec.map(pfn), rec.filter(keep));
            } else {
                return predicate(t) ? t : undefined;
            }
        }

        return (tree: Tree<V>) => pfn(tree) as Tree<V> | undefined;
    }
}
