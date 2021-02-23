
import * as proxy from './proxy';
import * as fp from './functional';

export type TagFactory<T> = {
    factory: (tagName: string, attrs: Attrs, content: Content) => T;
    contentFilter?: (u: unknown) => boolean;
}

export type Attrs = {[k: string]: any};
export type Content = any[];

export type TagParts =
    | TagParts[]
    | string | number
    | {[k in string]: string | EventListenerOrEventListenerObject}
;

export const metaTag = <T>(tf: TagFactory<T>) =>
    proxy.map((s: string) => (...tc: TagParts[]): T => {
        const cf = (tf.contentFilter) ? tf.contentFilter : () => false;
        const {attrs, content} = collect(cf, tc);
        return tf.factory(s,attrs,content);
    });

export const tag = metaTag({
    contentFilter: u => u instanceof HTMLElement,
    factory: (s,p,c) => {
        const el = document.createElement(s);
        fp.map(p, (v,k: string) => el.setAttribute(k,v));
        fp.map(c, (x) => {
            if (typeof x === 'string') {
                el.appendChild(document.createTextNode(x));
            } else {
                document.appendChild(x);
            }
        });
        return el;
    }
});

function collect(cf: (u: unknown) => boolean, tc: TagParts[]): {attrs: Attrs, content: Content} {
    const attrs: Attrs = {};
    const content: Content = [];

    for (const c of tc) {
        if (cf(c)) {
            content.push(c);
        } else if (Array.isArray(c)) {
            const {attrs: sa, content: sc} = collect(cf, tc);
            Object.assign(attrs, sa);
            content.push(...sc);
        } else if (typeof c === 'object') {
            Object.assign(attrs, c);
        } else {
            content.push(c);
        }
    }

    return {attrs, content};
}
