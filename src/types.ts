
// a thing that is a generator or iterator
export type GeneratorOrIterator<T> =
    | Generator<T, void, undefined>
    | Iterator<T, void, undefined>
    | IterableIterator<T>
;

// Zip/Transpose related types
export type Zippable = (unknown[] | GeneratorOrIterator<unknown>)[]
export type ZipType<Q extends Zippable> = {
    [k in keyof Q]:
        Q[k] extends unknown[] ? Q[k][number] :
        Q[k] extends Generator<infer T, any, any> ? T :
        never
}
