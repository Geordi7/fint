
import {flow} from './pipes';
import { PrettyIntersection as I } from './types';

// Failed Experiment
// dispatch over a 'typescripty' descriminated union
// why did it fail?
// when it comes time to instantiate the dispatcher, it must immediately have access to the type of its ultimate argument, otherwise it doesn't work

type Union = {
    type: 'a',
    a: number,
} | {
    type: 'b',
    b: string,
}

type EnforceDispatch<T, K extends keyof U, U extends {[KK in K]: string}> =
    T extends Dispatch<K,U> ? T : Dispatch<K,U>

type Dispatch<K extends keyof U, U extends {[KK in K]: string}> =
    {[KK in U[K]]: (u: I<U & {type: KK}>) => unknown};

type DispatchReturn<D> =
    D extends {[K in string]: ((x: never) => infer R)} ? R : never;

export const union = {
    dispatch: <D, U extends {[KK in K]: string}, K extends keyof U>(
        discriminant: K, dispatcher: EnforceDispatch<D,K,U>) => (u: U): DispatchReturn<D> =>
            (dispatcher as any)[u[discriminant]](u),
}

declare const u: Union;

const r = flow(u,
    union.dispatch('type', {
        a: a => a.a,
        b: b => b.b.length,
    }))
