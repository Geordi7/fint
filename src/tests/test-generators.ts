
import {
    iter,
    next,
    collect,
    count,
    index,
    repeat,
    range,
} from '../generators'

import * as mocha from 'mocha';
import * as chai from 'chai';
export function test() {
    const {describe, it} = mocha;
    const {assert, expect} = chai;

    describe('iter', ()=>{
        it('takes an iterable and produces an iterator', ()=>{
            const i = iter([99]);
            expect(i).has('next');
            const a = i.next();
            expect(a).equals(99);
        });
    });

    describe('next', ()=>{
        it('produces the next value of a generator', ()=>{
            const g = (function*(){yield 99;})();
            const a = next(g);
            expect(a).equals(99);
        });
        it('produces the next value of an iterator', ()=>{
            const i = [99][Symbol.iterator]();
            const a = next(i);
            expect(a).equals(99);
        });
        it('produces a default value', ()=>{
            const i = [][Symbol.iterator]();
            const a = next(i,99);
            expect(a).equals(99);
        });
    });

    describe('collect', ()=>{
        it('takes an iterator and produces an array', ()=>{
            const i = iter([1,2,3]);
            const a = collect(i);
            expect(a).deep.equals([1,2,3]);
        });
        it('takes a generator and produces an array of its values', ()=>{
            const g = (function*(){yield 99; yield 100;})();
            const a = collect(g);
            expect(a).deep.equals([99,100]);
        });
    });

    describe('count', ()=>{
        it('produces numbers sequentially starting at zero', ()=>{
            const g = count();
            const a = [g.next().value, g.next().value, g.next().value]
            expect(a).deep.equals([0,1,2]);
        });
    });

    describe('index', ()=>{
        it('produces numbers sequentially starting at zero up to a number', ()=>{
            const g = index(5);
            const a = collect(g);
            expect(a).deep.equals([0,1,2,3,4]);
        });
    });

    describe('repeat', ()=>{
        it('produces the same value repeatedly', ()=>{
            const g = repeat(99);
            const a = [g.next().value, g.next().value, g.next().value]
            expect(a).deep.equals([99,99,99]);
        });
    });

    describe('range', ()=>{
        it('produces numbers sequentially starting at zero up to a number', ()=>{
            const r = range(5);
            const a = collect(r);
            expect(a).deep.equals([0,1,2,3,4])
        });
        it('produces numbers sequentially starting at zero down to a negative number', ()=>{
            const r = range(-5);
            const a = collect(r);
            expect(a).deep.equals([0,-1,-2,-3,-4]);
        });
        it('produces numbers sequentially, starting low and ending high', ()=>{
            const r = range(4,8);
            const a = collect(r);
            expect(a).deep.equals([4,5,6,7]);
        });
        it('produces numbers sequentially, starting high and ending low', ()=>{
            const r = range(8,4);
            const a = collect(r);
            expect(a).deep.equals([8,7,6,5]);
        });
        it('produces numbers sequentially with a step greater than 1', ()=>{
            const r = range(2,6,2);
            const a = collect(r);
            expect(a).deep.equals([2,4]);
        });
    });
}
