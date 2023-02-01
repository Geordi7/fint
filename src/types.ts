import { raise } from "./misc";

export type PrettyIntersection<V> = Extract<{ [K in keyof V]: V[K] }, unknown>;

export type MaybePromise<T> = T | Promise<T>;

export const isPromise = <T>(thing: MaybePromise<T>): thing is Promise<T> =>
    ('then' in (thing as object) && typeof (thing as {then: unknown}).then === "function");

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
