
// Result<R,E> type
// Usage:
//  use as return type for a function:
//      <A>(a:A) => Result<R,E>
//
//  In the function body
//      return Ok(r) -- for ok results
//      return Err(e) -- for problematic results to be resolved by a caller
//
//  When you have a result (r)
//      r.map(R1 => R2) -- to map an Ok of one type to an Ok of another
//      r.mapErr(E1 => E2) -- to map an Err of one type to an Err of another
//      r.bind(R1 => Result<R2,E2>) -- to map into a new result or coalesce errors
//      r.isOk() -- to check if its Ok
//      r.ok() -- to get the ok value or throw the error as an exception
//      r.isErr() -- to check if its Err
//      r.err() -- to get the err value or throw an exception

import { is } from "./types";

export type Result<R,E> = IResult<R,E>;
export type PResult<R,E> = Promise<Result<R,E>>;
export type Ok<R> = ResultOk<R>;
export type Err<R> = ResultErr<R>;

export function Ok<R>(result: R): Result<R, never> {return new ResultOk(result);}
export function Err<E>(error: E): Result<never, E> {return new ResultErr(error);}

// result tools
export const Result = {
    Ok,
    Err,

    // wrap a function that can raise an exception
    // create a function which captures success in Ok and exceptions in Err
    lift:
    (<V extends unknown[], R>(fn: (...v: V) => R) =>
    (...v: V): unknown => {
        try {
            const r = fn(...v);
            if (is.promise(r)) {
                return r.then(v => Ok(v))
                    .catch(e => e instanceof Error ? Err(e) :
                        Err(new Error('unexpected error type', {cause: e})));
            } else {
                return Ok(r);
            }
        } catch (e) {
            return e instanceof Error ? Err(e) :
                Err(new Error('unexpected error type', {cause: e}));
        }
    }) as
        & (<V extends unknown[], R extends Promise<unknown>>(fn: (...v: V) => R) => (...v: V) => PResult<Awaited<R>,Error>)
        & (<V extends unknown[], R extends unknown>(fn: (...v: V) => R) => (...v: V) => Result<R,Error>),

    // call a function that can raise an exception
    // capture success in Ok() and exceptions in Err()
    capture: (<R>(fn: () => R): Result<R,Error> | PResult<R,Error> => Result.lift(fn)()) as
        & (<R extends Promise<unknown>>(fn: () => R) => PResult<Awaited<R>, Error>)
        & (<R extends unknown>(fn: () => R) => Result<R, Error>),

    // point free versions of IResult
    map: <R1,R2>(fn: (q: R1) => R2) => <E>(r: Result<R1,E>): Result<R2,E> => r.map(fn),
    bind: <R1,R2,E1>(fn: (a: R1) => Result<R2,E1>) => <E2>(r: Result<R1,E2>): Result<R2, E1 | E2> => r.bind(fn),
    mapError: <E1,E2>(fn: (e: E1) => E2) => <R>(r: Result<R,E1>): Result<R,E2> => r.mapError(fn),
    mapElse: <R1,R2,E1,E2>(rfn: (r: R1) => R2, efn: (e: E1) => E2) => (r: Result<R1,E1>): Result<R2,E2> => r.mapElse(rfn, efn),
    out: <R1,E1,O>(rfn: (r: R1) => O, efn: (e: E1) => O) => (r: Result<R1,E1>): O => r.out(rfn, efn),
    okOr: <R1>(ev: R1) => <E1>(r: Result<R1,E1>): R1 => r.okOr(ev),
    okElse: <R1,E1>(efn: (e: E1) => R1) => (r: Result<R1,E1>): R1 => r.okElse(efn),
    ok: <R>(r: Result<R,unknown>) => r.ok(),
    isOk: <R>(r: Result<R,unknown>): r is ResultOk<R> => r.isOk(),
    err: <E>(r: Result<unknown,E>) => r.err(),
    isErr: <E>(r: Result<unknown,E>): r is ResultErr<E> => r.isErr(),

    // other tools
    collect: <R,E>(i: Iterable<Result<R,E>>): {ok: R[], err: E[]} => {
        const r = {ok: [] as R[], err: [] as E[]};

        for (const item of i) {
            item.isOk() ?
                r.ok.push(item.ok()) :
                r.err.push(item.err());
        }

        return r;
    },

    all: <R,E>(i: Iterable<Result<R,E>>): Result<R[], E[]> => {
        const {ok,err} = Result.collect(i);

        return (err.length > 0) ? Err(err) : Ok(ok);
    },

    any: <R,E>(i: Iterable<Result<R,E>>): Result<R[], E[]> => {
        const {ok,err} = Result.collect(i);

        return (ok.length > 0) ? Ok(ok) : Err(err);
    },

} satisfies 
    // I want this because it guarantees all the point free ops are included
    & {[K in keyof IResult<unknown, unknown>]: unknown}
    & {
        Ok: unknown,
        Err: unknown,
        lift: unknown,
        capture: unknown,
        collect: unknown,
        all: unknown,
        any: unknown,
    }
;

export class ResultOk<R0> implements IResult<R0,never> {
    r: R0;
    constructor(r: R0) {this.r = r;}
    map<R1>(fn: (r: R0) => R1): Result<R1,never> {
        return Ok(fn(this.r));
    }
    bind<R1,E1>(fn: (r: R0) => Result<R1,E1>): Result<R1, E1> {
        return fn(this.r);
    }
    mapError(): Result<R0,never> {
        return this as unknown as Result<R0, never>;
    }
    mapElse<R1,E1>(rfn: (r: R0) => R1, _: (e: never) => E1) {
        return Ok(rfn(this.r));
    }
    out<O>(rfn: (r: R0) => O, _: (e: never) => O) {
        return rfn(this.r);
    }
    okOr(_: R0): R0 {
        return this.r;
    }
    okElse(_: (e: never) => R0): R0 {
        return this.r;
    }
    ok(): R0 {return this.r;}
    isOk(): this is ResultOk<R0> {return true;}
    err(): never {throw new Error(`Result is Ok but Err expected`);}
    isErr(): this is ResultErr<never> {return false;}
    toString(): string {return `Ok(${String(this.r)})`;}
}

export class ResultErr<E0> implements IResult<never,E0> {
    e: E0;
    constructor(e: E0) {this.e = e;}
    map<R1>(): Result<R1,E0> {
        return this as unknown as Result<R1,E0>;
    }
    bind<R1,E1>(): Result<R1, E0 | E1> {
        return this as unknown as Result<R1,E0>;
    }
    mapError<E1>(fn: (e: E0) => E1): Result<never,E1> {
        return Err(fn(this.e));
    }
    mapElse<R1,E1>(_: (r: never) => R1, efn: (e: E0) => E1) {
        return Err(efn(this.e));
    }
    out<O>(_: (n: never) => O, efn: (e: E0) => O) {
        return efn(this.e);
    }
    okOr(ev: never): never {
        return ev;
    }
    okElse(efn: (e: E0) => never): never {
        return efn(this.e);
    }
    ok(): never {
        if (this.e instanceof Error)
            throw this.e;
        else
            throw new Error(String(this.e));
    }
    isOk(): this is ResultOk<never> {return false;}
    err(): E0 {return this.e;}
    isErr(): this is ResultErr<E0> {return true;}
    toString(): string {return `Err(${String(this.e)})`;}
}

export interface IResult<R0,E0> {
    map<R1>(fn: (r: R0) => R1): Result<R1,E0>,
    bind<R1,E1>(fn: (r: R0) => Result<R1,E1>): Result<R1, E0 | E1>,
    mapError<E1>(fn: (e: E0) => E1): Result<R0,E1>,
    mapElse<R1,E1>(rfn: (r: R0) => R1, efn: (e: E0) => E1): Result<R1,E1>,
    out<O>(rfn: (r: R0) => O, efn: (e: E0) => O): O,
    okOr(ev: R0): R0,
    okElse(efn: (e:E0) => R0): R0,
    ok(): R0,
    isOk(): this is ResultOk<R0>,
    err(): E0,
    isErr(): this is ResultErr<E0>,
    toString(): string,
}
