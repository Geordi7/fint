
import {describe, it} from 'mocha';
import {expect} from 'chai';

import {
    arr,
    iter,
    tree,
} from '../transforms';

export function test() {
    describe('transforms', () => {
        describe('iter', () => {
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


