
import {describe, it} from 'mocha';
import {expect} from 'chai';

import {
    readProxy, pathFunctionProxy
} from '../proxy';

// readProxy type verification
((): {[K in string]: (n: number) => boolean} => readProxy(_ => (n: number) => n > 4));

// pathFunctionProxy type verification
((): (() => string) => pathFunctionProxy(p => () => p.join()));
((): (() => string) => pathFunctionProxy(p => () => p.join()).x.y.z);
((): ((a: string, b: number, c: boolean) => string) =>
    pathFunctionProxy(p => (a: string, b: number, c: boolean) => p.join() + a + `${b}${c}`));
((): ((a: string, b: number, c: boolean) => string) =>
    pathFunctionProxy(p => (a: string, b: number, c: boolean) => p.join() + a + `${b}${c}`).x.y.z);


export function test() {
    describe('proxy', () => {
        describe('readProxy', () => {
            it('converts properties to string arguments', () => {
                const rp = readProxy(s => s);

                expect(rp.a).equals('a');
                expect(rp.b).not.equals('a');
            });
        });

        describe('pathFunctionProxy', () => {
            it('is callable at the root', () => {
                const pfp = pathFunctionProxy(p => () => p);

                expect(pfp()).deep.equals([]);
            });

            it('reproduces deep properties as a path of strings', () => {
                const pfp = pathFunctionProxy(p => () => p);

                expect(pfp.a()).deep.equals(['a']);
                expect(pfp.x.y.z()).deep.equals(['x','y','z']);
            });

            it('passes through arguments sensibly', () => {
                const pfp = pathFunctionProxy(p => (...a: number[]) => [p,a]);

                expect(pfp(1,2,3)).deep.equals([[],[1,2,3]]);
                expect(pfp.x.y.z(99)).deep.equals([['x','y','z'],[99]]);
            });
        })
    });
}


