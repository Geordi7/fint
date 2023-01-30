
import {flow, over, rec, arr} from '../src/index';

() => flow({a: 1, b: 2}, rec.map(n => n > 0), rec.v);

() => flow({a: 1, b: 2}, rec.e,
        arr.reduce('', ([k,v]) => `${k}: ${v}`),
        s => `{${s}}`);

() => flow([{a: 1}, {a:2}, {a:3}],
        arr.map(o => o.a));

() => {const x = flow(4, n => ({incr: n + 1, decr: n -1, pos: n > 0, neg: n < 0}));}

async () => {
    const x = await over(fetch('https://www.example.com'),
        u => u.json(),
        b => ('error' in b ? 'err' : 'ok'))
}