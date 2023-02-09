
import { is } from '../types';
import { raise } from '../misc';

// is.function type predicate works
<T,U>(u: symbol | ((s: T) => U)): ((s: T) => U) => is.function(u) ? u : raise('');

export function test() {}
