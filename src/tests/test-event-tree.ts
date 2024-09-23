
import {describe, it} from 'mocha';
import {expect} from 'chai';

import {createEventTree, createPathEventTree} from '../event-tree';

export function test() {
    describe('event-tree', () => {
        it('sends messages to same-path targets', () => {
            const etr = createEventTree<number,void>();
            const collect = [] as number[];

            etr.subscribe(['a'], n => {collect.push(n)});

            etr.send(['a'], 1);

            expect(collect).deep.equals([1]);
        });

        it('allows multiple handlers and specific handler removal', () => {
            const etr = createEventTree<number,void>();
            const collect = [] as number[];

            const handler1 = (n: number) => {collect.push(10 + n)};
            const handler2 = (n: number) => {collect.push(20 + n)};
            const handler3 = (n: number) => {collect.push(30 + n)};
            etr.subscribe([], handler1);
            etr.subscribe([], handler2);
            const unsub3 = etr.subscribe([], handler3);

            etr.send([], 1);

            unsub3();

            etr.send([], 2);

            expect(collect).deep.equals([11,21,31,12,22]);
        });

        it('sends messages to ancestors', () => {
            const etr = createEventTree<number,void>();
            const collect = [] as string[][];

            const handler = (_: unknown,__: unknown, at: string[]) => {collect.push(at)};

            etr.subscribe([], handler);
            etr.subscribe(['a'], handler);
            etr.subscribe(['a', 'b'], handler);
            etr.subscribe(['a', 'b', 'c'], handler);
            etr.subscribe(['a', 'b', 'c', 'd'], handler);

            etr.send(['a','b','c','d'], 1);

            expect(collect).deep.equals([
                [],
                ['a'],
                ['a','b'],
                ['a','b','c'],
                ['a','b','c','d'],
            ]);
        });

        it('broadcasts messages to all decendants', () => {
            const etr = createEventTree<number,void>();
            const collect = [] as string[][];

            const handler = (_: unknown,__: unknown, at: string[]) => {collect.push(at)};

            etr.subscribe(['a', 'aa', 'aaa'], handler);
            etr.subscribe(['a', 'aa', 'aab'], handler);
            etr.subscribe(['a', 'ab', 'aba'], handler);
            etr.subscribe(['a', 'ab', 'abb'], handler);

            etr.send(['a'], 1);

            expect(collect).deep.equals([
                ['a', 'aa', 'aaa'],
                ['a', 'aa', 'aab'],
                ['a', 'ab', 'aba'],
                ['a', 'ab', 'abb']
            ]);
        });

        it('does not send to other branches', () => {
            const etr = createEventTree<number,void>();
            const collect = [] as string[][];

            const handler = (_: unknown,__: unknown, at: string[]) => {collect.push(at)};

            etr.subscribe(['a', 'aa'], handler);
            etr.subscribe(['a', 'ab'], handler);
            etr.subscribe(['b', 'ba'], handler);
            etr.subscribe(['b', 'bb'], handler);

            etr.send(['a'], 1);

            expect(collect).deep.equals([
                ['a', 'aa'],
                ['a', 'ab'],
            ]);
        });

        it('cleans up the tree after unsubscribe', () => {
            const etr = createEventTree<number,void>();
            const collect = [] as string[][];

            const handler = (_: unknown,__: unknown, at: string[]) => {collect.push(at)};

            const unsub = etr.subscribe(['a', 'b', 'c', 'd'], handler);

            etr.send(['a'], 1);
            expect(collect).deep.equals([['a', 'b', 'c', 'd']]);

            unsub();

            expect(etr.inspect()).deep.equals({
                parent: undefined,
                name: undefined,
                handlers: new Set(),
                children: {},
            });
        });

        it('includes an iterResponses methid which enumerates all responses with their corresponding paths', () => {
            const etr = createEventTree<number,number>();

            etr.subscribe([], n => n);
            etr.subscribe(['a'], n => n);
            etr.subscribe(['a','aa'], n => n);
            etr.subscribe(['a','ab'], n => n);
            etr.subscribe(['a','aa','aaa'], n => n);

            const collect = [...etr.iterResponses(etr.send(['a'], 1))]

            expect(collect).deep.equals([
                [[], 1],
                [['a'], 1],
                [['a','aa'], 1],
                [['a','aa','aaa'], 1],
                [['a','ab'], 1],
            ]);
        })

        describe('path-event-tree', () => {
            it('sends messages to same-path targets', () => {
                const etr = createPathEventTree<number,void>('/');
                const collect = [] as number[];
    
                etr.subscribe('a', n => {collect.push(n)});
    
                etr.send('a', 1);
    
                expect(collect).deep.equals([1]);
            });

            it('allows multiple handlers and specific handler removal', () => {
                const etr = createPathEventTree<number,void>('/');
                const collect = [] as number[];

                const handler1 = (n: number) => {collect.push(10 + n)};
                const handler2 = (n: number) => {collect.push(20 + n)};
                const handler3 = (n: number) => {collect.push(30 + n)};
                etr.subscribe('', handler1);
                etr.subscribe('', handler2);
                const unsub3 = etr.subscribe('', handler3);

                etr.send('', 1);

                unsub3();

                etr.send('', 2);

                expect(collect).deep.equals([11,21,31,12,22]);
            });
    
            it('sends messages to ancestors', () => {
                const etr = createPathEventTree<number,void>('/');
                const collect = [] as string[];
    
                const handler = (_: unknown, __: unknown, at: string) => {collect.push(at)};
    
                etr.subscribe('', handler);
                etr.subscribe('a', handler);
                etr.subscribe('a/b', handler);
                etr.subscribe('a/b/c', handler);
                etr.subscribe('a/b/c/d', handler);
    
                etr.send('a/b/c/d', 1);
    
                expect(collect).deep.equals([
                    '',
                    'a',
                    'a/b',
                    'a/b/c',
                    'a/b/c/d',
                ]);
            });
    
            it('broadcasts messages to all decendants', () => {
                const etr = createPathEventTree<number,void>('/');
                const collect = [] as string[];
    
                const handler = (_: unknown,__: unknown, at: string) => {collect.push(at)};
    
                etr.subscribe('a/aa/aaa', handler);
                etr.subscribe('a/aa/aab', handler);
                etr.subscribe('a/ab/aba', handler);
                etr.subscribe('a/ab/abb', handler);
    
                etr.send('a', 1);
    
                expect(collect).deep.equals([
                    'a/aa/aaa',
                    'a/aa/aab',
                    'a/ab/aba',
                    'a/ab/abb',
                ]);
            });
    
            it('does not send to other branches', () => {
                const etr = createPathEventTree<number,void>('/');
                const collect = [] as string[];
    
                const handler = (_: unknown,__: unknown, at: string) => {collect.push(at)};
    
                etr.subscribe('a/aa', handler);
                etr.subscribe('a/ab', handler);
                etr.subscribe('b/ba', handler);
                etr.subscribe('b/bb', handler);
    
                etr.send('a', 1);
    
                expect(collect).deep.equals([
                    'a/aa',
                    'a/ab',
                ]);
            });

            it('cleans up the tree after unsubscribe', () => {
                const etr = createPathEventTree<number,void>('/');
                const collect = [] as string[];
    
                const handler = (_: unknown,__: unknown, at: string) => {collect.push(at)};
    
                const unsub = etr.subscribe('a/b/c/d', handler);
    
                etr.send('a', 1);
                expect(collect).deep.equals(['a/b/c/d']);
    
                unsub();
    
                expect(etr.inspect()).deep.equals({
                    parent: undefined,
                    name: undefined,
                    handlers: new Set(),
                    children: {},
                });
            });

            it('includes an iterResponses method which enumerates all responses and wraps the paths', () => {
                const etr = createPathEventTree<number,number>('/');
    
                etr.subscribe('', n => n);
                etr.subscribe('a', n => n);
                etr.subscribe('a/aa', n => n);
                etr.subscribe('a/ab', n => n);
                etr.subscribe('a/aa/aaa', n => n);

                const collect = [...etr.iterResponses(etr.send('a', 1))]

                expect(collect).deep.equals([
                    ['', 1],
                    ['a', 1],
                    ['a/aa', 1],
                    ['a/aa/aaa', 1],
                    ['a/ab', 1],
                ]);
            });
        })
    });
}

// original test case
if(0) {
    const etr = createEventTree<number, number>();
    
    const mh = (label:string) => (m: number, p: string[], mp: string[]) => {
        console.log(label, p, mp, m);
        return m;
    }
    
    etr.subscribe([], mh('root'));
    etr.subscribe(['one'], mh('one'));
    etr.subscribe(['one','two'], mh('one-two'));
    etr.subscribe(['one','three'], mh('one-three'));
    etr.subscribe(['one','three','five'], mh('one-three-five'));
    etr.subscribe(['one','four'], mh('one-four'));
    etr.subscribe(['else'], mh('else'));
    
    console.log('received', [...etr.iterResponses(etr.send(['one', 'three'], 1))]);
}
