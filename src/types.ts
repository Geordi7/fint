import { raise } from "./misc";
import { rec } from "./transforms";

export type PlainOldData =
    | null
    | string
    | number
    | boolean
    | integer
    | unsigned
    | bigint
    | PlainOldData[]
    | {[K in string]: PlainOldData}
;

export type PrettyIntersection<V> = Extract<{ [K in keyof V]: V[K] }, unknown>;

export type Maybe<T> = T | null | undefined;

export type MaybePromise<T> = T | Promise<T>;

export const is = {
    undefined: (thing: unknown): thing is undefined => thing === undefined,
    null: (thing: unknown): thing is null => thing === null,

    string: (thing: unknown): thing is string => (typeof thing) === 'string',
    number: (thing: unknown): thing is number => (typeof thing) === 'number',
    object: (thing: unknown): thing is object => (typeof thing) === 'object',
    function: (thing: unknown): thing is Function => (typeof thing) === 'function',

    nullish: (t: unknown): t is null | undefined => (t == null),
    
    array: <T>(thing: unknown | T[]): thing is T[] => Array.isArray(thing),

    record: <K extends PropertyKey, V>(thing: unknown | Record<K,V>): thing is Record<K,V> =>
        !is.array(thing) && is.object(thing),

    promise: <T>(thing: MaybePromise<T>): thing is Promise<T> =>
        ('then' in (thing as object) && is.function((thing as {then: unknown}).then)),
}

// nominal types
declare const brand: unique symbol;
export type Nominal<T, Label extends string> = T & {readonly [brand]: Label};

export type integer = Nominal<number, 'integer' | 'unsigned'>;
export const integer = {
    parse: (u: unknown): integer => {
        return Number.isInteger(u) ? u as integer :
            raise(`${u} is not an integer`);
    }
}

export type unsigned = Nominal<number, 'unsigned'>;
export const unsigned = {
    parse: (u: unknown): unsigned => {
        return  Number.isInteger(u) && (u as integer) >= 0 ? u as unsigned :
        raise(`${u} is not an integer`);
    }
}

export const clone = <V extends PlainOldData>(v: V): V => {
    if (is.array(v))
        return v.map(clone) as V;
    else if (is.record(v))
        return rec.map(clone)(v) as V;
    else
        return v;
}
