
import {describe, it} from 'mocha';
import {expect} from 'chai';

import {
    arr,
    dispatch,
    iter,
    match,
    tree,
} from '../transforms';

export function test() {
    describe('transforms', () => {
        describe('union', () => {
            describe('dispatch', () => {
                it('calls the right function for the variant', () => {
                    const variant = {a: 'x', b: 1} as const;
                    expect(dispatch('a', variant, {x: v => v.b}))
                        .equals(1);
                    });
                it('complains if the variant is unknown', () => {
                    const variant = {a: 'x', b: 1} as const;
                    expect(() => dispatch('a', variant, {}))
                        .throws('failed to dispatch discriminant x with dispatcher with keys []');
                });
            });

            describe('match', () => {
                it('calls the right function for the variant', () => {
                    const variant = {a: 1};
                    expect(match(variant, {a: v => v.a}))
                        .equals(1);
                });
                it('complains if the variant is unknown', () => {
                    const variant = {a: 1};
                    expect(() => match(variant, {}))
                        .throws('could not match variant with keys [a] with matcher with keys []')
                })
            });
        });

        describe('iter', () => {
            describe('iter.chain', () => {
                it('chains iterators together', () => {
                    const i = iter.chain(iter.index(3), [9,9,9], iter.repeatn(2)(-1));
                    const c = [...i];

                    expect(c).deep.equals([0,1,2,9,9,9,-1,-1]);
                });
            });

            describe('iter.chunk', () => {
                it('produces chunks from an iterator', () => {
                    const i = iter.index(20);
                    const c = [...iter.chunk(6)(i)];

                    expect(c).deep.equals([
                        [0,1,2,3,4,5],
                        [6,7,8,9,10,11],
                        [12,13,14,15,16,17],
                        [18,19]
                    ]);
                });
            });

            describe('iter.repeat', () => {
                it('produces the same value repeatedly', () => {
                    const checkvalue = Math.random();
                    const i = iter.repeat(checkvalue);

                    const check = iter.step<number>(n =>
                        expect(n).equals(checkvalue));
                    
                    check(i);
                    check(i);
                    check(i);
                });
            });

            describe('iter.repeatn', () => {
                it('produces the same a specific number of times', () => {
                    const checkvalue = Math.random();
                    const i = iter.repeatn(6)(checkvalue);
                    const a = [...i];

                    expect(a).deep.equals([checkvalue, checkvalue, checkvalue, checkvalue, checkvalue, checkvalue]);
                });
            });

            describe('iter.aperture', () => {
                it('produces a sequence of subsequences of a specific length', () => {
                    const sequence = [1,2,3,4,5,6,7,8];
                    const a = [...iter.aperture(3)(sequence)];
                    
                    expect(a).deep.equals([
                        [1,2,3],
                        [2,3,4],
                        [3,4,5],
                        [4,5,6],
                        [5,6,7],
                        [6,7,8],
                    ]);
                });
            });
            
            describe('iter.apertureExt', () => {
                it('produces a sequence of subsequences of a specific length padding with nulls', () => {
                    const sequence = [1,2,3,4,5,6,7,8];
                    const a = [...iter.apertureExt(3)(sequence)];

                    const n = null;
                    
                    expect(a).deep.equals([
                        [n,n,1],
                        [n,1,2],
                        [1,2,3],
                        [2,3,4],
                        [3,4,5],
                        [4,5,6],
                        [5,6,7],
                        [6,7,8],
                        [7,8,n],
                        [8,n,n],
                    ]);
                });
            });
        });

        describe('arr', () => {
            describe('arr.product', () => {
                it('produces the cartesian product of a pair of arrays', () => {
                    const i = arr.product(
                        ['a','b'],
                        [true,false]);
                    
                    const output = [...i];

                    expect(output).deep.equals([
                        ['a',true],['a',false],['b',true],['b',false],
                    ]);
                });

                it('produces the cartesian product of a triple of arrays', () => {
                    const i = arr.product(
                        [1,2,3],
                        ['a','b'],
                        [true,false]);
                    
                    const output = [...i];

                    expect(output).deep.equals([
                        [1,'a',true],[1,'a',false],[1,'b',true],[1,'b',false],
                        [2,'a',true],[2,'a',false],[2,'b',true],[2,'b',false],
                        [3,'a',true],[3,'a',false],[3,'b',true],[3,'b',false],
                    ]);
                });
            });

            describe('arr.chunk', () => {
                it('chunks an input iterable', () => {
                    const i = iter.index(20);
                    const c = arr.chunk(6)(i);

                    expect(c).deep.equals([
                        [0,1,2,3,4,5],
                        [6,7,8,9,10,11],
                        [12,13,14,15,16,17],
                        [18,19]
                    ]);
                });
            });


        });

        describe('tree', () => {
            describe('tree.map', () => {
                it('deeply maps values from one tree to another', () => {
                    const t1 = {a: 1, b: [2,3,4]};
                    const t2 = {a: 11, b: [12, 13, 14]};

                    const output = tree.map((n: number) => n + 10)(t1);

                    expect(output).deep.equals(t2);
                });
            });

            describe('tree.prune', () => {
                it('allows validated scalars', () => {
                    expect(tree.prune(n => n === 1)(1)).equals(1);
                })

                it('removes unwanted values from records', () => {
                    const t1 = {a: 1, b: 2};
                    const t2 = {a: 1};

                    const output = tree.prune((n: number) => n === 1)(t1);

                    expect(output).deep.equals(t2);
                });

                it('removes unwanted values from arrays', () => {
                    const t1 = [1,2,3];
                    const t2 = [2];

                    const output = tree.prune((n: number) => n === 2)(t1);

                    expect(output).deep.equals(t2);
                });

                it('removes empty arrays after pruning', () => {
                    const t1 = [[1,1],[1,2],[3,4]];
                    const t2 = [[2]];

                    const output = tree.prune((n: number) => n === 2)(t1);

                    expect(output).deep.equals(t2);
                });

                it('removes empty records after pruning', () => {
                    const t1 = [{a: 1}, {a: 2}, {a: 3}];
                    const t2 = [{a: 2}];

                    const output = tree.prune((n: number) => n === 2)(t1);

                    expect(output).deep.equals(t2);
                });

                it('returns undefined on a rejected scalar', () => {
                    expect(tree.prune((n: number) => n === 1)(2)).is.undefined;
                });
            });
        });
    });
}


