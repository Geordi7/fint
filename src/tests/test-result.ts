import { Result } from "../result";

(): Result<number, Error> => Result.lift((n: number) => n+1)(1);
(): Result<number, Error> => Result.capture(() => 1);
(): Promise<Result<number, Error>> => Result.lift(async (n: number) => n+1)(1);
(): Promise<Result<number, Error>> => Result.capture(async () => 1);

export function test() {}
