
import { is, tuple } from '../types';
import { raise } from '../misc';

// is.function type predicate works
<T,U>(u: symbol | ((s: T) => U)): ((s: T) => U) => is.function(u) ? u : raise('');

// tuple() constructor: comparison with 'vanilla' tuples
((): (number | string)[] => [1,'a']);
((): [number, string] => tuple(1,'a'));

export function test() {}
