
import { is, tuple } from '../types';
import { raise } from '../misc';
import { flow } from '../pipes';
import { arr, iter } from '../transforms';

// is.function type predicate works
<T,U>(u: symbol | ((s: T) => U)): ((s: T) => U) => is.function(u) ? u : raise('');

// tuple() constructor: comparison with 'vanilla' tuples
((): (number | string)[] => [1,'a']);
((): [number, string] => tuple(1,'a'));

// map iterator problems
((): string[] => flow(['a','b','c','d','e','f','g'],
    arr.partition(s => s > 'd'),
    m => m.entries(),
    iter.collect,
    ([[_,sa]]) => sa
));

export function test() {}
