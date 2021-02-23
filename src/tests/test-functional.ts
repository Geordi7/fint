
import {
    map,
    magic,
    zip,
    transpose,
} from '../functional';

import {
    collect
} from '../generators';

import * as mocha from 'mocha';
import * as chai from 'chai';
export function test() {
    const {describe, it} = mocha;
    const {assert, expect} = chai;

    describe('map', ()=>{
        describe('map.a', ()=>{
            it('maps arrays to arrays', ()=>{
                const a = [1,2,3];
                const b = map.a(a, x => x + 1);
    
                expect(b).is.an('array')
                    .and.deep.equals([2,3,4]);
            });
        });

        describe('map.ag', ()=>{
            it('maps arrays to generators', ()=>{
                const a = [1,2,3];
                const b = map.ag(a, x => x + 1);
                const c = collect(b);
    
                expect(b).is.a('generator');
                expect(c).deep.equals([2,3,4]);
            });
        });

        describe('map.ar', ()=>{
            it('maps arrays to records', ()=>{
                const a = [1,2,3];
                const b = map.ar(a, x => ['k'+x, x*10]);
                
                expect(b).is.an('object')
                    .and.deep.equals({k1: 10, k2: 20, k3: 30});
            });
            it('drops values that map to null', ()=>{
                const a = [5,15,5];
                const b = map.ar(a, (x,i) => (x>10 ? null : ['k'+i, x]));
                expect(b).deep.equals({k0: 5, k2: 5});
            });
        });

        describe('map.r', ()=>{
            it('maps records to records with the same keys', ()=>{
                const a = {a:10,b:20};
                const b = map.r(a, x=>x+1);
                expect(b).deep.equals({a:11, b:21});
            });
        });

        describe('map.rr', ()=>{
            it('maps records to records with different keys', ()=>{
                const a = {a: 10, b:20};
                const b = map.rr(a, (x,k) => [k+k, x+1]);
                expect(b).deep.equals({aa: 11, bb: 21})
            });
            it('drops values that map to null', ()=>{
                const a = {a: 5, b:15};
                const b = map.rr(a, (x,k) => (x>10 ? null : [k+k, x+1]));
                expect(b).deep.equals({aa: 6});
            });
        })

    });
}


