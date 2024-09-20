import { flow } from "./pipes";
import { tree } from "./transforms";

export type PrettyIntersection<V> = Extract<{ [K in keyof V]: V[K] }, unknown>;
export type Maybe<T> = T | null | undefined;
export type MaybePromise<T> = T | Promise<T>;
export type Scalar = string | number | boolean | bigint;

export const is = {
    undefined: (thing: unknown): thing is undefined => thing === undefined,
    null: (thing: unknown): thing is null => thing === null,

    boolean: (thing: unknown): thing is boolean => (typeof thing) === 'boolean',
    string: (thing: unknown): thing is string => (typeof thing) === 'string',
    number: (thing: unknown): thing is number => (typeof thing) === 'number',
    object: (thing: unknown): thing is object => (typeof thing) === 'object',
    function: (thing: unknown): thing is Function => (typeof thing) === 'function',
    bigint: (thing: unknown): thing is bigint => (typeof thing) === 'bigint',

    scalar: (thing: unknown): thing is Scalar =>
        is.string(thing) || is.number(thing) || is.boolean(thing) || is.bigint(thing),

    nullish: (t: unknown): t is null | undefined => (t == null),

    real: (t: unknown): t is number => is.number(t) && Number.isFinite(t),
    
    array: <T>(thing: unknown | T[]): thing is T[] => Array.isArray(thing),

    record: <K extends PropertyKey, V>(thing: unknown | Record<K,V>): thing is Record<K,V> =>
        !is.array(thing) && is.object(thing),

    promise: <T>(thing: MaybePromise<T>): thing is Promise<T> =>
        ('then' in (thing as object) && is.function((thing as any).then)),

    set: (thing: unknown): thing is Set<unknown> => (thing instanceof Set),
    map: (thing: unknown): thing is Map<unknown, unknown> => (thing instanceof Map),
    date: (thing: unknown): thing is Date => (thing instanceof Date && Number.isFinite(thing.valueOf())),
}

// exhaust(value, message) - type utility function
//  when resolving a union, the left over value after all possiblities have been exhausted should have type never
//  pass the variable into this function, with relevant message for the resulting error
//  typescript will guard against calling this function on a non-never value
//  and if at runtime an unexpected value arrives it will turn into a runtime error
export function exhaust(_: never, msg: string): never {
    throw new Error(msg);
}

// nominal types
declare const brand: unique symbol;
export type Nominal<T, Label extends string> = T & {readonly [brand]: Label};

export type Tree<T> = T | Tree<T>[] | {[K in string]: Tree<T>};
export type PlainOldData = Tree<null | string | number | boolean | bigint | Date>
export type JSONSerializable = Tree<null | string | number | boolean>

export const makeJSONSerializable = (pod: PlainOldData): JSONSerializable => flow(pod,
    tree.map(item =>
        is.bigint(item) ? item?.toString() + 'n' :
        is.date(item) ? item.toISOString() :
        item))
;

export type KeysAcrossUnion<T> = T extends infer TT ? string & keyof TT : never;

export type PropsAcrossUnion<T> = T extends infer TT ? TT[keyof TT] : never;

export type RequiredKeys<T> =
    keyof T extends infer K ? K extends keyof T ?
        undefined extends T[K] ? never : K : never : never
;

export type Tuple<A extends unknown[]> =
    A extends [] ? [] :
    A extends [infer H, ...infer T] ?
        [H, ...Tuple<T>] :
        never
;

export const tuple = <TupleParts extends unknown[]>(...parts: TupleParts): Tuple<TupleParts> => parts as any;
