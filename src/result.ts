
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

import { is, MaybePromise } from "./types";

export type Result<R,E> = Ok<R> | Err<E>;
export type PResult<R,E> = Promise<Result<R,E>>;
export type Ok<R> = ResultOk<R>;
export type Err<R> = ResultErr<R>;

export function Ok<R>(result: R): Result<R, never> {return new ResultOk(result);}
export function Err<E>(error: E): Result<never, E> {return new ResultErr(error);}

// result tools
export const Result = {
    // wrap a function that can raise an exception
    // create a function which captures success in Ok and exceptions in Err
    lift: (<V extends unknown[], R>(fn: (...v: V) => R) => (...v: V): MaybePromise<Result<R,Error>> => {
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
    ok: <R>(r: Result<R,unknown>) => r.ok(),
    isOk: <R>(r: Result<R,unknown>): r is ResultOk<R> => r.isOk(),
    err: <E>(r: Result<unknown,E>) => r.err(),
    isErr: <E>(r: Result<unknown,E>): r is ResultErr<E> => r.isErr(),
    toString: <R>(r: Result<R,unknown>) => r.ok(),
};

export class ResultOk<R> implements IResult<R,never> {
    r: R;
    constructor(r: R) {this.r = r;}
    map<Q>(fn: (q: R) => Q): Result<Q,never> {
        return Ok(fn(this.r));
    }
    bind<Q,E>(fn: (a: R) => Result<Q,E>): Result<Q, E> {
        return fn(this.r);
    }
    mapError(): Result<R,never> {
        return this as unknown as Result<R, never>;
    }
    mapElse<Q,EE>(rfn: (r: R) => Q, _: (e: never) => EE) {
        return Ok(rfn(this.r));
    }
    ok(): R {return this.r;}
    isOk(): true {return true;}
    err(): never {throw new Error(`Result is Ok but Err expected`);}
    isErr(): false {return false;}
    toString(): string {return `Ok(${String(this.r)})`;}
}

export class ResultErr<E> implements IResult<never,E> {
    e: E;
    constructor(e: E) {this.e = e;}
    map<Q>(): Result<Q,E> {
        return this as unknown as Result<Q,E>;
    }
    bind<Q,EE>(): Result<Q, E | EE> {
        return this as unknown as Result<Q,E>;
    }
    mapError<EE>(fn: (e: E) => EE): Result<never,EE> {
        return Err(fn(this.e));
    }
    mapElse<Q,EE>(_: (u: never) => Q, efn: (e: E) => EE) {
        return Err(efn(this.e));
    }
    ok(): never {
        if (this.e instanceof Error)
            throw this.e;
        else
            throw new Error(String(this.e));
    }
    isOk(): false {return false;}
    err(): E {return this.e;}
    isErr(): true {return true;}
    toString(): string {return `Err(${String(this.e)})`;}
}

export interface IResult<R,E> {
    map<Q>(fn: (a: R) => Q): IResult<Q,E>,
    bind<Q,EE>(fn: (a: R) => IResult<Q,EE>): IResult<Q, E | EE>,
    mapError<EE>(fn: (e: E) => EE): IResult<R,EE>,
    mapElse<Q,EE>(rfn: (a: R) => Q, efn: (e: E) => EE): IResult<Q,EE>,
    ok(): R,
    isOk(): this is ResultOk<R>,
    err(): E,
    isErr(): this is ResultErr<E>,
    toString(): string,
}
