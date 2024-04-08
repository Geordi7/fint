
import { tree, rec, set } from "./transforms";
import { raise } from "./misc";
import { flow } from "./pipes";
import { is, PlainOldData } from "./types";

// merge semantics:
// deep copy of previous and next into a new object
// prefer values from next, unless null/undefined, then prefer previous
// append items in arrays
// check for type 
export const configMerge = (previous: PlainOldData, next: PlainOldData): PlainOldData =>
    configMergeRecursive(previous, next, '');

const configMergeRecursive = (previous: PlainOldData, next: PlainOldData, path: string): PlainOldData => {
    return is.nullish(next) ? previous :
        is.array(previous) ? is.array(next) ?
            [...tree.clone(previous) as PlainOldData[], ...tree.clone(next) as PlainOldData[]] :
            raise(`${path}: cannot merge non-array into array`) :
        is.record(previous) ? is.record(next) ?
            flow(set.union(rec.k(previous), rec.k(next)),
                rec.fromKeys(k => configMergeRecursive(previous[k], next[k], `${path}.${k}`))) :
            raise(`${path}: cannot merge non-record into record`) :
        // previous is scalar
        tree.clone(next)
    ;
};
