import { flow } from "./pipes";
import { rec } from "./transforms";
import { is } from "./types";

export const quill = (dialect: Dialect, rschema: RelaxedSchema): Quill => {
    const schema: Schema = dialect.embed ?
        dialect.embed(rschema) :
        defaultEmbedding(rschema);

    return async <T>(parser: Parser<T>, queryBuilder: (r: RelationSource, ops: Ops) => Query): Promise<T> => {
        const instances = [] as {relation: string, constraints: Constraint[]}[];
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

        const conditions = [] as BExpr[];

        const query = queryBuilder(s, createOps((...b) => {conditions.push(...b)}));

        console.log('INSTANCES:', instances);
        console.log(JSON.stringify(query, null, '  '));

        return is.function(parser) ?
            parser(null) :
            parser.parse(null);
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

export type Dialect = {
    exec: (query: string) => Promise<unknown>;
    render: (query: ResolvedQuery) => string;
    // quote: (s: string) => RenderedExpression,
    // conditional: (cases: {predicate: RenderedExpression, result: RenderedExpression}[], otherwise: RenderedExpression) => RenderedExpression,
    embed?: (rs: RelaxedSchema) => Schema,
};

export type ResolvedQuery = {};

export type Query =
    | {[All]: QueryShape, order?: Expr[]}
    | {[One]: QueryShape, order?: Expr[]}
    | {[Some]: QueryShape, order?: Expr[]}
;

export const All = Symbol('all');
export const One = Symbol('one');
export const Some = Symbol('some');

export type QueryShape = Record<string, Query | Expr | RelationRef>

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
    sum: (over: NExpr) => ({sum: over}),
    product: (over: NExpr) => ({product: over}),
    average: (over: NExpr) => ({average: over}),

    // comparisons
    is: (a: Expr) => ({
        equal: (b: Expr) => ({eq: [a,b]}),
        lessThan: (b: Expr) => ({lt: [a,b]}),
        greaterThan: (b: Expr) => ({gt: [a,b]}),
        inRange: (low: Expr, high: Expr) => ({and: [{ge: [low, a]}, {gt: [a, high]}]})
    }),
} as const;

const createOps = (where: (...b: BExpr[]) => void) => ({where, ...baseOps});

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
;

// string expression
export type SExpr =
    | FieldRef | string
    | {join: SExpr[], with: SExpr}
    | {joinAll: SExpr, with: SExpr}
    | {left: SExpr, len: NExpr}
    | {right: SExpr, len: NExpr}
    | {slice: SExpr, from?: NExpr, to?: NExpr}
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
;

// numeric expression
export type DExpr = Date;

// aggregate expression
export type AggExpr = never;

export type RenderedExpression = string;

export type Quill = <T>(parser: Parser<T>, queryBuilder: (r: RelationSource, ops: Ops) => Query) => Promise<T>;
export type Parser<T> =
    | ((u: unknown) => T)
    | {parse: (u: unknown) => T}