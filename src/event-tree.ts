
import { flow } from "./pipes";
import { iter, rec } from "./transforms";
import { tuple } from "./types";

export type EventTree<Msg, Ans> = {
    subscribe: (path: string[], handler: Handler<Msg, Ans>) => Unsubscribe;
    send: (path: string[], msg: Msg) => Responses<Ans>;
    inspect: () => Readonly<Node<Msg,Ans>>;
    iterResponses: (res: Responses<Ans>) => IterableIterator<[string[], Ans]>;
}

export type Handler<Msg, Ans> = (msg: Msg, toPath: string[], atPath: string[]) => Ans;
export type Unsubscribe = () => void;
export type Responses<Answer> = {
    responses: Answer[],
    childResponses: {[Step in string]: Responses<Answer>}
};

export type Node<Msg, Ans> = {
    parent?: Node<Msg, Ans>,
    name?: string,
    handlers: Set<Handler<Msg, Ans>>,
    children: {[Step in string]: Node<Msg, Ans>}
};

export type StrEventTree<Msg,Ans> = {
    subscribe: (path: string, handler: StrHandler<Msg,Ans>) => Unsubscribe;
    send: (path: string, msg: Msg) => Responses<Ans>;
    inspect: () => Readonly<Node<Msg,Ans>>;
    iterResponses: (res: Responses<Ans>) => IterableIterator<[string, Ans]>;
}

export type StrHandler<Msg, Ans> = (msg: Msg, toPath: string, atPath: string) => Ans;

const newNode = <Msg, Ans>(parent?: Node<Msg, Ans>, name?: string) => ({parent, name, handlers: new Set(), children: {}}) as Node<Msg, Ans>;
const newResponses = <A>(): Responses<A> => ({responses: [], childResponses: {}});

export function createEventTree<Msg, Ans>(): EventTree<Msg, Ans> {
    const root: Node<Msg, Ans> = newNode();

    return {
        subscribe(path, handler) {
            let next = root;

            for (const step of path) {
                next = next.children[step] =
                    next.children[step] ?? newNode(next, step);
            }

            next.handlers.add(handler);

            return () => {
                next.handlers.delete(handler);
                while (
                    next.handlers.size === 0 &&
                    rec.k(next.children).length === 0
                ) {
                    const {name} = next;
                    if (name) {
                        next = next.parent!;
                        delete next.children[name];
                    } else {
                        break;
                    }
                }
            };
        },

        send(path, msg) {
            // linecast
            const results = newResponses<Ans>();
            let collect = results;
            let next = root;
            let at = [] as string[];

            for (const step of path) {
                collect.responses = flow(next.handlers,
                    iter.map(h => h(msg, path, [...at])),
                    iter.collect);

                if (step in next.children) {
                    next = next.children[step];
                    at.push(step)
                    collect = collect.childResponses[step] = newResponses<Ans>();
                } else {
                    // the message was sent to a branch with no subscriptions
                    // there is nothing more to be done
                    return results;
                }
            }

            // broadcast
            Object.assign(collect, broadcast(path, at, next, msg));

            return results;
        },

        iterResponses(res) {
            return iterResponses([], res);
        },

        inspect() {
            return root;
        }
    }
}

export function createPathEventTree<Msg,Ans>(pathSeparator: string): StrEventTree<Msg, Ans> {
    const evt = createEventTree<Msg,Ans>();

    const takePath = (p: string) => p.split(pathSeparator).filter(s => s.length > 0);
    const makePath = (p: string[]) => p.join(pathSeparator);

    return {
        inspect() {return evt.inspect()},
        subscribe(path, handler) {
            return evt.subscribe(takePath(path), (m,to,at) =>
                handler(m, makePath(to), makePath(at)));
        },
        send(path, msg) {
            return evt.send(takePath(path), msg);
        },
        iterResponses(res) {
            return flow(iterResponses([], res),
                iter.map(([path, answer]) => tuple(makePath(path), answer))
            );
        }
    }
}

function broadcast<M,A>(path: string[], at: string[], node: Node<M,A>, msg: M): Responses<A> {
    return {
        responses: flow(node.handlers,
            iter.map(h => h(msg, path, at)),
            iter.collect,
        ),
        childResponses: flow(node.children,
            rec.map((child, name) => broadcast(path, [...at, name], child, msg))
        ),
    }
}

function * iterResponses<A>(path: string[], r: Responses<A>): IterableIterator<[string[], A]> {
    yield * r.responses.map(a => tuple(path, a));
    for (const [name, child] of rec.e(r.childResponses)) {
        yield * iterResponses([...path, name], child);
    }
}
