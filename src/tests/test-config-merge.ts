
import {describe, it} from 'mocha';
import {expect} from 'chai';

import {
    configMerge
} from '../config-merge';

export function test() {
    describe('config-merge', () => {
        describe('configMerge', () => {
            it('appends arrays', () => {
                const a = [1,2,3];
                const b = [4,5,6];
                const c = configMerge(a,b);

                expect(c).deep.equals([1,2,3,4,5,6]);
            });

            it('merges objects', () => {
                const a = {a: 1, b: 1};
                const b = {b: 2, c: 2};
                const c = configMerge(a,b);

                expect(c).deep.equals({a: 1, b: 2, c: 2});
            });

            it('merges at depth', () => {
                const a = {a: {aa: {aaa: 1, aab: 1}, ab: [1,2]}};
                const b = {a: {aa: {aab: 2, aac: 2}, ab: [3,4]}};
                const c = configMerge(a,b);

                expect(c).deep.equals({a: {aa: {aaa: 1, aab: 2, aac: 2}, ab: [1,2,3,4]}})
            })
        });
    });
}


