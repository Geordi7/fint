
import {Enum, EnumFrom} from '../enum';

// type verification

type A = EnumFrom<typeof A>;
const A = Enum<{
    A1: number
    A2: string
}>()('A');

type B = EnumFrom<typeof B>;
const B = Enum<{
    B1: number[],
    B2: boolean[],
}>()('B');

(): ((typeof A)['A1'] extends ((a: number) => A) ? true : false) => true;
(): ((typeof A)['A2'] extends ((a: string) => A) ? true : false) => true;
(): ((typeof B)['B1'] extends ((a: number[]) => B) ? true : false) => true;
(): ((typeof B)['B2'] extends ((a: boolean[]) => B) ? true : false) => true;

type AB = A|B;

