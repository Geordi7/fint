import { flow, raise, PrettyIntersection as I } from "./index";

const data = Symbol();

// Enum Type Builder
export type Enum<Tag extends string, Structure extends {[V in string]: unknown}> =
    keyof Structure extends infer V ? V extends string ?
        I<{[K in Tag]: V} & {[data]: Structure[V]}> : never : never
;

export type EnumInstance<Tag extends string, Structure extends {[V in string]: unknown}, Variant extends keyof Structure> =
    I<Enum<Tag, Structure> & {[T in Tag]: Variant}>;

declare const key: unique symbol;
declare const structure: unique symbol;

// Enum Type Inferer
export type EnumFrom<Factory> =
    Factory extends {[key]: infer Key} ?
        Key extends string ?
            Factory extends {[structure]: infer S} ?
                S extends {[V in string]: unknown} ?
                    Enum<Key,S> :
                never :
            never :
        never :
    never;

// Realtime Enum Tools
export type RTEnumFactory =
<S extends {[V in string]: unknown}>() => <Tag extends string>(tag: Tag) => I<
    // necessary for type inference
    & {[key]: Tag, [structure]: S}
    & {
        [K in `is${string & keyof S}`]:
            K extends `is${infer VV}` ? VV extends keyof S ?
                (e: Enum<Tag,S>) =>
                    e is Enum<Tag,S> & {[T in Tag]: VV} :
                    never : never
    } & {
        [K in `as${string & keyof S}`]:
            K extends `as${infer VV}` ? VV extends keyof S ?
                <R>(e: I<Enum<Tag,S> & {[T in Tag]: VV}>, op: (v: S[VV]) => R) => R
            : never : never
    } & {
        [VV in string & keyof S]:
            (s: S[VV]) => I<Enum<Tag,S> & {[T in Tag]: VV}>
    } & {
        variant: (e: Enum<Tag,S>) => keyof S,
        dispatch: <R>(
            e: Enum<Tag,S>,
            dispatcher: {[VV in string & keyof S]: (e: S[VV]) => R}
        ) => R,
        dispatcher: <R>(
            dispatcher: {[VV in string & keyof S]: (e: S[VV]) => R}
        ) => (e: Enum<Tag,S>) => R,
        dispatchPartial: <R>(
            e: Enum<Tag,S>,
            dispatcher: I<{
                [VV in string & keyof S]?: (e: S[VV]) => R
            } & {
                default: (e: Enum<Tag,S>) => R
            }>
        ) => R,
        dispatcherPartial: <R>(
            dispatcher: I<{
                [VV in string & keyof S]?: (e: S[VV]) => R
            } & {
                default: (e: Enum<Tag,S>) => R
            }>
        ) => (e: Enum<Tag,S>) => R,
        dispatchDefault: <R>(
            e: Enum<Tag,S>,
            defaultValue: R,
            dispatcher: {[VV in string & keyof S]?: (e: S[VV]) => R}
        ) => R,
        dispatcherDefault: <R>(
            defaultValue: R,
            dispatcher: {[VV in string & keyof S]?: (e: S[VV]) => R}
        ) => (e: Enum<Tag,S>) => R,
    }
>;

export const Enum: RTEnumFactory = () => (s: string) => {
    const specials = (s: string) => ({
        dispatch:
            (e: any, disp: any) =>
                flow(Object.keys(e)[0].split('.'),
                    ([tag,v]) => disp[v](e[tag])),
        dispatcher:
            (disp: any) => (e: any) =>
                flow(Object.keys(e)[0].split('.'),
                    ([tag,v]) => disp[v](e[tag])),
        dispatchPartial:
            (e: any, disp: any) =>
                flow(Object.keys(e)[0].split('.'),
                    ([tag,v]) => v in disp ? disp[v](e[tag]) : disp.default(e)),
        dispatcherPartial:
            (disp: any) => (e: any) =>
                flow(Object.keys(e)[0].split('.'),
                    ([tag,v]) => v in disp ? disp[v](e[tag]) : disp.default(e)),
dispatchDefault:
            (e: any, d: any, disp: any) =>
                flow(Object.keys(e)[0].split('.'),
                    ([tag,v]) => v in disp ? disp[v](e[tag]) : d),
        dispatcherDefault:
            (d: any, disp: any) => (e: any) =>
                flow(Object.keys(e)[0].split('.'),
                    ([tag,v]) => v in disp ? disp[v](e[tag]) : d),
variant:
            (e: any) => Object.keys(e)[0].split('.')[1],
    });
    
    return new Proxy({}, {
        get(target: any, prop: string) {
            if (!(prop in target)) {
                if (prop in specials) {
                    target[prop] = specials[prop as keyof typeof specials];
                } else if (prop.startsWith('is')) {
                    const label = s + '.' + prop.slice(2);
                    target[prop] = (e: any) => e[s] === label;
                } else if (prop.startsWith('as')) {
                    const label = s + '.' + prop.slice(2);
                    target[prop] = (e: any, o: any) =>
                        label in e ? o(e[label]) : raise(`instance is not variant ${label}`);
                } else {
                    target[prop] = (e: any) => ({...e, [s]: prop});
                }
            }
            return target[prop];
        }
    }) as any;
}
