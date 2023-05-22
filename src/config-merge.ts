
import { tree, rec, set } from "./transforms";
import { raise } from "./misc";
import { flow } from "./pipes";
import { is, PlainOldData } from "./types";

// merge semantics:
// deep copy 
// replace keys in host
// append items in arrays
// replace scalars with whatever comes in
export const configMerge = (previous: PlainOldData, next: PlainOldData): PlainOldData =>
    configMergeRecursive(previous, next, '');

const configMergeRecursive = (previous: PlainOldData, next: PlainOldData, path: string): PlainOldData => {
    return is.array(previous) ? is.array(next) ?
            [...tree.clone(previous) as PlainOldData[], ...tree.clone(next) as PlainOldData[]] :
            raise(`${path}: cannot merge non-array into array`) :
        is.record(previous) ? is.record(next) ?
            flow(set.union(rec.k(previous), rec.k(next)),
                rec.fromKeys(k => configMergeRecursive(previous[k], next[k], `${path}.${k}`))) :
            raise(`${path}: cannot merge non-record into record`) :
        // previous is scalar
        is.nullish(next) ?
            previous :
            tree.clone(next)
    ;
};
