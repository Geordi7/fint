import { flow } from "./pipes";
import { hstr, match, rec } from "./transforms";
import { is } from "./types";

export const quill = (broker: Broker, rschema: RelaxedSchema): Quill => {
    const schema: Schema = broker.embed ?
        broker.embed(rschema) :
        defaultEmbedding(rschema);

    return <T, P extends QueryParametersBase>(parser: Parser<T>, queryBuilder: (tools: QueryBuilderTools) => Query<P>): QueryHost<P,T> => {
        const instances = [] as {relation: string, constraints: Constraint[]}[];

        // create schema access
        const s = flow(schema.relations, rec.map((r,rn) => (...c: Constraint[]) => {
            const i = instances.length;
            instances.push({
                relation: rn,
                constraints: c,
            });
            return {
                $instance: i,
                ...flow(r.fields, rec.map((_f,fn) => ({
                    instance: i,
                    field: fn,
                })))
            } as RelationRef;
        }));

        // global query conditions
        const conditions = [] as BExpr[];

        // run querybuilder
        const query = queryBuilder({
            s,
            ops: createOps(),
            where: (...b) => {conditions.push(...b);}
        });

        //@DEBUG
        console.log('INSTANCES:', JSON.stringify(instances, null, '  '));
        console.log(JSON.stringify(query, null, '  '));

        // const [qtype, queryshape] = query;
        // console.log(qtype, queryshape)

        return {
            exec: async (params?: P) => {
                console.log(params);

                return is.function(parser) ?
                    parser(null) :
                    parser.parse(null);
            },
        }
    }
};

export const defaultEmbedding = (schema: RelaxedSchema): Schema => {
    return {
        types: schema.types,
        relations: flow(schema.relations, rec.map((r,rn) => ({
            embedding: r.embedding ?? rn,
            id: is.array(r.id) ? r.id : [r.id],
            fields: flow(r.fields, rec.map((f,fn) =>
                is.string(f) ? {embedding: fn, type: [f]} :
                is.array(f) ? {embedding: fn, type: f} :
                f
            )),
        }))),
    };
};

export const createSQLBroker(sd: SQLDialect, exec: (sql: string, params: Record<string, unknown>) => Promise<unknown>): Broker {
    const sr = createSQLRenderer(sd);
    return {
        exec,
        render(query) {
            
        },
    }
};

export type RelationSource = Record<string, (...c: Constraint[]) => RelationRef>;
export type RelationRef = {$instance: number} & Record<string, FieldRef>;
export type FieldRef = {instance: number, field: string};

export type Constraint = {$instance: number} | FieldRef | Record<string, Expr>;

export type RelaxedSchema = {
    types: Record<string, Type>,
    relations: Record<string, RelaxedRelation>,
};

export type RelaxedRelation = {
    embedding?: string,
    id: string | string[],
    fields: Record<string, RelaxedField>,
}

export type RelaxedField = Field | string | string[];

export type Schema = {
    types: Record<string, Type>,
    relations: Record<string, Relation>,
};

export type Type = {
    // if this is a dimension, it should inhabit a specific relation with only itself as id
    inhabits?: string,
    dt: string | string[],
}

export type Relation = {
    embedding: string,
    id: string[],
    fields: Record<string, Field>,
}

export type Field = {
    embedding: string | string[],
    type: string | string[],
}

export type Broker = {
    exec: <P extends QueryParametersBase>(query: RenderedQuery<P>, params: ParamsFor<P>) => Promise<unknown>;
    render: <P extends QueryParametersBase>(query: ResolvedQuery<P>) => RenderedQuery<P>;
    // quote: (s: string) => RenderedExpression,
    // conditional: (cases: {predicate: RenderedExpression, result: RenderedExpression}[], otherwise: RenderedExpression) => RenderedExpression,
    embed?: (rs: RelaxedSchema) => Schema,
};

export type ResolvedQuery<P extends QueryParametersBase> = {
    instances: {relation: string, constraints: Constraint[]}[],
    query: Query<P>
};

export type RenderedQuery<P extends QueryParametersBase> = {
    rendered: string,
    params: P
};

export type QueryHost<P extends QueryParametersBase, T> = {
    exec: keyof P extends never ?
        (() => Promise<T>) :
        ((params: P) => Promise<T>),
};

export type QueryParametersBase = {[Prop in string]: string};

export type ParamsFor<P extends QueryParametersBase> = {
    [K in keyof P]: ParamFor<P[K]>
}

export type ParamFor<S extends string> =
    S extends 'text' ? string :
    S extends 'int' ? number | bigint :
    S extends 'real' ? number | bigint :
    S extends 'dec' ? {value: bigint, decimals: number} :
    S extends 'date' ? Date :
    never
;

export type Query<P extends QueryParametersBase> = QueryShape<P>
    // | ['all', QueryShape<P>]
    // | ['one', QueryShape<P>]
    // | ['some', QueryShape<P>]
;

export type QueryShape<P extends QueryParametersBase> = {
    [Prop in string]:
        // | Query<P>
        | Expr
        // | RelationRef
};

export type Ops = (typeof createOps) extends (where: (...b: BExpr[]) => void) => infer R ? R : never;

// ops create expressions
const baseOps = {
    any: (...b: BExpr[]) => ({or: b}),
    all: (...b: BExpr[]) => ({and: b}),

    // arithmetic
    add: (...e: NExpr[]) => ({add: e}),
    sub: (a: NExpr, b: NExpr) => ({sub: [a,b]}),
    neg: (e: NExpr) => ({neg: e}),

    mul: (...e: NExpr[]) => ({mul: e}),
    div: (a: NExpr, b: NExpr) => ({div: [a,b]}),
    mod: (a: NExpr, b: NExpr) => ({mod: [a,b]}),
    inv: (e: NExpr) => ({inv: e}),

    // more math
    power: (base: NExpr, power: NExpr) => ({base, pow: power}),

    // aggregations
    count: (over: Expr) => ({count: over}),
    sum: (over: NExpr) => ({sum: over}),
    product: (over: NExpr) => ({product: over}),
    average: (over: NExpr) => ({average: over}),

    // string operations
    left: (len: NExpr, subject: SExpr) => ({left: subject, len}),
    right: (len: NExpr, subject: SExpr) => ({right: subject, len}),
    slice: (from: NExpr, to: NExpr, subject: SExpr) => ({slice: subject, from, to}),
    join: (sep: SExpr, ...parts: SExpr[]) => ({join: parts, sep}),

    // parameters
    param: {
        text: (paramName: string) => ({textParam: paramName}),
        int: (paramName: string) => ({intParam: paramName}),
        date: (paramName: string) => ({dateParam: paramName}),
        real: (paramName: string) => ({realParam: paramName}),
        dec: (paramName: string) => ({decParam: paramName}),
        bool: (paramName: string) => ({boolParam: paramName}),
    },

    // input data
    input: (name: string, spec: Record<string, string>) => ({input: name, spec}),

    // comparisons
    is: (a: Expr) => ({
        equal: (b: Expr) => ({eq: [a,b]}),
        lessThan: (b: Expr) => ({lt: [a,b]}),
        greaterThan: (b: Expr) => ({gt: [a,b]}),
        inRange: (low: Expr, high: Expr) => ({and: [{ge: [low, a]}, {gt: [a, high]}]})
    }),
} as const;

const createOps = () => baseOps;

// expressions
export type Expr = {free: string}
    | NExpr | SExpr | BExpr | DExpr | AggExpr
;

// numeric expression
export type NExpr =
    | FieldRef | number
    | {add: NExpr[]} | {sub: NExpr[]} | {neg: NExpr}
    | {mul: NExpr[]} | {div: NExpr[]} | {mod: NExpr[]}
    | {length: SExpr}
    | {sum: NExpr}
    | {product: NExpr}
    | {average: NExpr}
    | {base: NExpr, pow: NExpr}
    | {intParam: string}
    | {realParam: string}
    | {decParam: string}
;

// string expression
export type SExpr =
    | FieldRef | string
    | {join: SExpr[], with: SExpr}
    | {joinAll: SExpr, with: SExpr}
    | {left: SExpr, len: NExpr}
    | {right: SExpr, len: NExpr}
    | {slice: SExpr, from?: NExpr, to?: NExpr}
    | {join: SExpr[], sep: SExpr}
    | {textParam: string}
;

// numeric expression
export type BExpr =
    | FieldRef | boolean
    | {and: BExpr[]} | {or: BExpr[]}
    | {eq: Expr[]} | {neq: Expr[]} 
    | {lt: Expr[]} | {le: Expr[]}
    | {gt: Expr[]} | {ge: Expr[]}
    | {isNull: Expr}
    | {isNotNull: Expr[]}
    | {is: Expr, in: FieldRef | Expr[]}
    | {is: Expr, notIn: FieldRef | Expr[]}
    | {is: SExpr, like: SExpr}
    | {boolParam: string}
;

// numeric expression
export type DExpr =
    | Date
    | {dateParam: string}
;

// aggregate expression
export type AggExpr = never;

export type RenderedExpression = string;

export type QueryBuilderTools = {
    s: RelationSource,
    ops: Ops,
    where: (...conditions: BExpr[]) => void,
};

export type Quill = <T, P extends QueryParametersBase>(parser: Parser<T>, queryBuilder: (tools: QueryBuilderTools) => Query<P>) => QueryHost<P,T>;
export type Parser<T> =
    | ((u: unknown) => T)
    | {parse: (u: unknown) => T}
;

export type SQLDialect = {
    quote: (identifier: string) => string,
    str: (string: string) => string,
    cast: (typename: string, val: string) => string,
    concat: (...vals: string[]) => string,
    textType: string,
}

export const createSQLRenderer = (sd: SQLDialect, schema: Schema): (<P extends QueryParametersBase>(rq: ResolvedQuery<P>) => string) => {
    const {quote: q, str} = sd;

    return (rq) => {
        const {instances, query} = rq;

        const relations = instances.map(i => schema.relations[i.relation]);

        const terms = flow(query, rec.aMap((term, name) => {
            const expr = renderSQLExpr(relations, sd, term);
            return `${expr} as ${q(name)}`
        }))

        return hstr.render('  ')([
            'SELECT', hstr.separate(',')(terms),
        ])
    }
}

function renderSQLExpr(relations: Relation[], sd: SQLDialect, e: Expr): string {
    if (is.string(e))
        return sd.str(e);
    else if (is.number(e))
        return String(e);
    else if (is.boolean(e))
        return String(e);
    else if (is.date(e))
        return e.toISOString();
    
    return match(e, {
        free: (s) => s.free,
        instance: (fr) => {
            const relname = sd.quote(`R${fr.instance}`);
            const fieldEmbedding = relations[fr.instance].fields[fr.field].embedding;
            const fieldType = relations[fr.instance].fields[fr.field].type;

            if (is.array(fieldEmbedding)) {
                const renderedFields = fieldEmbedding.map(f => sd.cast(sd.textType, `${relname}.${sd.quote(f)}`));
                return sd.concat(...renderedFields);
            } else {
                return `${relname}.${fieldEmbedding}`;
            }
        },
        add: (ne) => 
    });
}
