
import {MaybePromise} from './types';

export const into = <T>(t: T) => new Into(t);

export class Into<V> {
    private value: V;

    constructor(value: V) {
        this.value = value;
    }

    then<U>(fn: (v: V) => U) {
        return new Into(fn(this.value));
    }

    out() {
        return this.value;
    }
}

export const flow = ((u: unknown, ...fns: ((u: unknown) => unknown)[]): unknown => {
    for (const fn of fns) {
        u = fn(u);
    }
    return u;
}) as Flow;

export const promise = <T>(i: T) => new Promise<T>(r => r(i));

export const pipe = ((...fns: ((u: unknown) => unknown)[]) =>
    (i: unknown) => fns.reduce((v, f) => f(v as never), i)) as Pipe;

export const bridge: Bridge = ((...fns: ((u: unknown) => MaybePromise<unknown>)[]) => 
    async (i: unknown): Promise<unknown> => fns.reduce(
        (p, f) => p.then(f),
        new Promise(r=> r(i))
    )) as Bridge;

export const over = (async (u: unknown, ...fns: ((u: unknown) => MaybePromise<unknown>)[]) =>
    fns.reduce(
        (p,f) => p.then(f),
        new Promise(r => r(u))
    )) as Over

export type Pipe =
    & (<T1, T2>(
        f1: (i: T1) => T2) => (i: T1) => T2)
    & (<T1, T2, T3>(
        f1: (i: T1) => T2,
        f2: (i: T2) => T3) => (i: T1) => T3)
    & (<T1, T2, T3, T4>(
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4) => (i: T1) => T4)
    & (<T1, T2, T3, T4, T5>(
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5) => (i: T1) => T5)
    & (<T1, T2, T3, T4, T5, T6>(
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6) => (i: T1) => T6)
    & (<T1, T2, T3, T4, T5, T6, T7>(
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6,
        f6: (i: T6) => T7) => (i: T1) => T7)
    & (<T1, T2, T3, T4, T5, T6, T7, T8>(
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6,
        f6: (i: T6) => T7,
        f7: (i: T7) => T8) => (i: T1) => T8)
    & (<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6,
        f6: (i: T6) => T7,
        f7: (i: T7) => T8,
        f8: (i: T8) => T9) => (i: T1) => T9)
    ;
    
export type Flow =
    & (<T1>(i: T1) => T1)
    & (<T1, T2>(i: T1,
        f1: (i: T1) => T2) => T2)
    & (<T1, T2, T3>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3) => T3)
    & (<T1, T2, T3, T4>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4) => T4)
    & (<T1, T2, T3, T4, T5>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5) => T5)
    & (<T1, T2, T3, T4, T5, T6>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6) => T6)
    & (<T1, T2, T3, T4, T5, T6, T7>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6,
        f6: (i: T6) => T7) => T7)
    & (<T1, T2, T3, T4, T5, T6, T7, T8>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6,
        f6: (i: T6) => T7,
        f7: (i: T7) => T8) => T8)
    & (<T1, T2, T3, T4, T5, T6, T7, T8, T9>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6,
        f6: (i: T6) => T7,
        f7: (i: T7) => T8,
        f8: (i: T8) => T9) => T9)
    & (<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(i: T1,
        f1: (i: T1) => T2,
        f2: (i: T2) => T3,
        f3: (i: T3) => T4,
        f4: (i: T4) => T5,
        f5: (i: T5) => T6,
        f6: (i: T6) => T7,
        f7: (i: T7) => T8,
        f8: (i: T8) => T9,
        f9: (i: T9) => T10) => T10)
    ;
    
export type Bridge =
    & (<T1, T2>(
        f1: (i: T1) => MaybePromise<T2>) => (i: Promise<T1>) => Promise<T2>)
    & (<T1, T2, T3>(
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>) => (i: Promise<T1>) => Promise<T3>)
    & (<T1, T2, T3, T4>(
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>) => (i: Promise<T1>) => Promise<T4>)
    & (<T1, T2, T3, T4, T5>(
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>) => (i: Promise<T1>) => Promise<T5>)
    & (<T1, T2, T3, T4, T5, T6>(
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>) => (i: Promise<T1>) => Promise<T6>)
    & (<T1, T2, T3, T4, T5, T6, T7>(
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>,
        f6: (i: T6) => MaybePromise<T7>) => (i: Promise<T1>) => Promise<T7>)
    & (<T1, T2, T3, T4, T5, T6, T7, T8>(
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>,
        f6: (i: T6) => MaybePromise<T7>,
        f7: (i: T7) => MaybePromise<T8>) => (i: Promise<T1>) => Promise<T8>)
    & (<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>,
        f6: (i: T6) => MaybePromise<T7>,
        f7: (i: T7) => MaybePromise<T8>,
        f8: (i: T8) => MaybePromise<T9>) => (i: Promise<T1>) => Promise<T9>)
    ;
    
export type Over =
    & (<T1, T2>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>) => Promise<T2>)
    & (<T1, T2, T3>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>) => Promise<T3>)
    & (<T1, T2, T3, T4>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>) => Promise<T4>)
    & (<T1, T2, T3, T4, T5>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>) => Promise<T5>)
    & (<T1, T2, T3, T4, T5, T6>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>) => Promise<T6>)
    & (<T1, T2, T3, T4, T5, T6, T7>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>,
        f6: (i: T6) => MaybePromise<T7>) => Promise<T7>)
    & (<T1, T2, T3, T4, T5, T6, T7, T8>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>,
        f6: (i: T6) => MaybePromise<T7>,
        f7: (i: T7) => MaybePromise<T8>) => Promise<T8>)
    & (<T1, T2, T3, T4, T5, T6, T7, T8, T9>(i: Promise<T1>,
        f1: (i: T1) => MaybePromise<T2>,
        f2: (i: T2) => MaybePromise<T3>,
        f3: (i: T3) => MaybePromise<T4>,
        f4: (i: T4) => MaybePromise<T5>,
        f5: (i: T5) => MaybePromise<T6>,
        f6: (i: T6) => MaybePromise<T7>,
        f7: (i: T7) => MaybePromise<T8>,
        f8: (i: T8) => MaybePromise<T9>) => Promise<T9>)
    ;
    