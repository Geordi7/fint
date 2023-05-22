
export const readProxy = <U>(proxy: (s: string) => U) => new Proxy({},
    Object.assign(neverProxyHandler<{[K in string]: U}>('readProxy'), {
        get(target: {[K in string]: U}, p: string) {
            target[p] = target[p] ?? proxy(p);
            return target[p];
        },
    })
);

const neverProxyHandler = <U extends object>(label: string): ProxyHandler<U> => ({
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
        throw new Error(`ownKeys(): Cannot query for own keys of as ${label}`);
    },
    preventExtensions() {
        return false;
    },
    setPrototypeOf() {
        throw new Error(`setPrototypeOf(): Cannot set prototype of a ${label}`);
    }
})
