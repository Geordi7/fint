
import { is, Sync, tuple } from '../types';
import { raise } from '../misc';

// is.function type predicate works
<T,U>(u: symbol | ((s: T) => U)): ((s: T) => U) => is.function(u) ? u : raise('');

// tuple() constructor: comparison with 'vanilla' tuples
((): (number | string)[] => [1,'a']);
((): [number, string] => tuple(1,'a'));

// Sync
const sMap = <T>(fn: (n: number) => Sync<T>): Sync<T> => fn(4) as Sync<T>;
const x = sMap(async () => 'ok');

export function test() {}
