
// proxy a function over an object
// the function must take a string as an argument:
//      const prepend = proxy.map((s1: string) => (...s2: string) => s1 + s2));
//      prepend.abc('xyz') --> 'abcxyz'
//
// optional first argument is a host which overrides the function
//      const prepend = proxy.map({abc: 'foo'}, (s1: string) => (...s2: string) => s1 + s2));
//      prepend.abc --> 'foo'

export const map:
    & (<K extends PropertyKey,T>(fn: (k: K) => T) => {[k in K]: T})
    & (<K extends PropertyKey,T,H>(host: H, fn: (k: K) => T) => H & {[k in K]: T})
= (<K extends PropertyKey,T>(a1: any | ((k: K) => T), a2?: (k: K) => T): {[k in K]: T} => {
    const fn = (a2 === undefined) ? a1 : a2;
    const host = (a2 === undefined) ? {} : a1;

    return new Proxy(host, {
        get(target: any, key: K) {
            if (!(key in target))
                target[key] = fn(key);
            return target[key];
        }
    });
}) as any;
