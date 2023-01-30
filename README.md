# fint

A library of strongly typed tools for typescript

```bash
npm install -s '@Geordi7/fint';
```

# Property Proxies

Create proxies for functions over the properties of a virtual object.

```typescript
import {readProxy} from '@Geordi7/fint';

const prefixy = readProxy((s1: string) => (s2: string) => s1 + s2);
const postfixy = readProxy((s1: string) => (s2: string) => s2 + s1);

const example1 = prefixy.abc('xyz')     // 'abcxyz'
const example2 = postfixy.abc('xyz')    // 'xyzabc'
const example3 = prefixy.hello(postfixy.world(' ')) // 'hello world'
```

or an example with html tags

```typescript
const tag = readProxy((tagname: string) => (props: Record<string, string>, ...content: string[]): string =>
    content.length ?
        `<${tagname} ${formatprops(props)}>${content.join('\n')}</${tagname}>` :
        `<${tagname} />`);

const formatprops = (props: Record<string,string>) =>
    rec.e(props).map(([k,v]) => `${k}=${v}`).join(' ');

const {html, head, body, title, div, p} = tag;

const doc = html({},
    head({}, title({}, 'A clever example of using a readProxy to create html tag functions')),
    body({},
        div({},
            p({}, 'paragraph 1'),
            p({}, 'paragraph 2')
        )
    )
);
```

# Data Transformation tools

easily create data transform pipelines for sync (`pipe`/`into`) or async (`bridge`/`over`) code.

point-free wrappers for common HOFs in:
* `arr` for arrays
* `rec` for records
* `iter` for iterators
* `maybe` for unions with null or undefined

and some helpers in
* `str` for strings
* `set` for sets
* `obj` for general objects

```typescript
import {rec, arr, into} from '@Geordi7/fint';

data = [1,2,3,4,5];
labels = ['a', 'b', 'c', 'd', 'e'];

const x = into([labels, data],      // [string[], number[]]
    arr.zip,                        // [string, number][]
    rec.from,                       // Record<string, number>
    rec.map(n => n > 2),            // Record<string, boolean>
    rec.entries,                    // [string, boolean][]
    arr.order(([k]) => k)           // [string, boolean][] (sorted on the strings)
);
```

```typescript
import {over, asyn} from '@Geordi7/fint';

async function delay<T>(miliseconds: number,v: T): Promise<T> {
    await new Promise(r => setTimeout(r, miliseconds));
    return v;
}

(async () => {
    await over([1,2,3,4,5],
        n => delay(1000, n)),

})()
```
