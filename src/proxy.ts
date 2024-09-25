
export const neverProxyHandler = <U extends object>(label: string): ProxyHandler<U> => ({
    set() {
        throw new Error(`set(): Cannot set properties on a ${label}`);
    },
    deleteProperty() {
        throw new Error(`deleteProperty(): Cannot delete properties values on a ${label}`);
    },
    apply() {
        throw new Error(`apply(): Cannot apply a ${label}`);
    },
    construct() {
        throw new Error(`construct(): Cannot construct a ${label}`);
    },
    defineProperty() {
        throw new Error(`defineProperty(): Cannot define properties on a ${label}`);
    },
    get() {
        throw new Error(`get(): Cannot get properties of a ${label}`);
    },
    getOwnPropertyDescriptor() {
        throw new Error(`getOwnPropertyDescriptor(): Cannot get property descriptors of a ${label}`);
    },
    getPrototypeOf() {
        throw new Error(`getPrototypeOf(): Cannot get prototype of a ${label}`);
    },
    has() {
        throw new Error(`has(): Cannot check for a property on a ${label}`);
    },
    isExtensible() {
        return false;
    },
    ownKeys() {
        throw new Error(`ownKeys(): Cannot query for own keys of a ${label}`);
    },
    preventExtensions() {
        return false;
    },
    setPrototypeOf() {
        throw new Error(`setPrototypeOf(): Cannot set prototype of a ${label}`);
    }
})

export const readProxy = <U>(proxy: (s: string) => U) => readProxyLabelled('readProxy', proxy);

export const readProxyLabelled = <U>(label: string, proxy: (s: string) => U) => new Proxy({},
    Object.assign(neverProxyHandler<{[K in string]: U}>(label), {
        get(target: {[K in string]: U}, p: string) {
            target[p] = target[p] ?? proxy(p);
            return target[p];
        },
    })
);

export type PathFunctionProxy<Fn extends Function> = (Fn & {[K in string]: PathFunctionProxy<Fn>})

export const pathFunctionProxy = <Fn extends Function>(proxy: (path: string[]) => Fn) => pathFunctionProxyLabelled('pathFunctionProxy', proxy);

export const pathFunctionProxyLabelled = <Fn extends Function>(label: string, proxy: (path: string[]) => Fn) => _pathFunctionProxy(label, [], proxy);    

const _pathFunctionProxy = <Fn extends Function>(label: string, path: string[], proxy: (path: string[]) => Fn) => new Proxy(
    
     // this never gets called
     // but without it there will be a type-error before apply is called
    (() => {}) as any,

    Object.assign(neverProxyHandler<PathFunctionProxy<Fn>>(label), {
        // get builds the next layer of proxy
        get(target: {[K in string]: PathFunctionProxy<Fn>}, p: string) {
            target[p] = target[p] ?? _pathFunctionProxy(label, [...path, p], proxy);
            return target[p];
        },
        // target is this proxy, self is the parent proxy (or undefined)
        // we only care about path anyway
        apply(_target: unknown, _self: unknown, args: unknown[]) {
            return proxy(path)(...args);
        }
    })
) as PathFunctionProxy<Fn>;
