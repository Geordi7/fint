
import {describe, it} from 'mocha';
import {expect} from 'chai';

import {
    arr,
    iter,
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
    });
}


