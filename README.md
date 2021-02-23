# ts-fint

A Typescript library with common functionality that many projects will need.

## Tour

generators: Tools for interacting with and combining generators

    iter(iterable)
        get an iterator over the iterable
    next(iterator or generator, failure value?)
        get the next item from the iterator or generator
        if it is exhausted return undefined,
        if a failure value is given, return that instead
    collect(iterator or generator)
        return an array with all the remaining values in the iterator or generator
    count*()
        generate numbers starting at 0
    index*(n: number)
        generate numbers starting at 0 up to n
    repeat(x)
        generate x over and over again
    range(n)
        just like index(n)
    range(a,b)
        generate a, then step towards b in increments of size 1
    range(a,b,s)
        generate a, then step towards b in increments of size s
    zip(...generators)
        transpose the arguments generating tuples of the items in them
        [a1,b1,c1] then [a2,b2,c2] and so on...
    seq(...generators)
        generate all the items in the first generator,
        then the second, then the third, and so on...

functional: Tools for interacting with collections... whether they are records or arrays (note that we prefer the use of Record<K,T>)

    map.a(array, fn)
        like array.map
    map.ag(array, fn)
        like Array.map(), but provides a generator for the results
        fn is called each time a value is consumed
    map.ar(array, fn)
        fn: (value, index, array) => [key, result] | null
        map an array to a record using a function that produces key-value pairs
        if the function returns null the entry is ignored
    
    map.r(record, fn)
        fn: (value, key, record) => result
        map a record to another record with same keys
    map.rr(record, fn)
        fn: (value, key, record) => [newKey, result] | null
        map a record to a record with different keys
        if the function returns null the entry is ignored
    map.ra(record,fn)
        fn: (value, key, record) => result
        map a record to an array
    map.rg(record,fn)
        fn: (value, key, record) => result
        map a record to a generator, the function is called each time a value is consumed
    
    map.g(gen, fn)
        fn: (value) => result
        map a generator into another generator
    map.gg(gen, fn)
        fn: (value) => result | null
        map a generator into another generator
        if the function returns null the item is skipped
    map.ga(gen, fn)
        fn: (value) => result
        map a generator to an array
    map.gr(gen, fn)
        fn: (value) => [key, result] | null
        map a generator to a record
        if the function returns null the item is skipped

    magic(thing, fn)
        fn: (value, key, thing) => result
        maps a structure to the same shape with results in place of values

    zip(...iterables)
        produces an array of arrays such that the nth array has the nth item of every argument

    transpose(matrix, rank)
        matrix is a 2D matrix in a 1D array
        this function transposes it with respect to rank

proxy: Tools to hide extra behavior in seemingly innocent objects

tag: Tools for generating HTML in a programmatic fashion
