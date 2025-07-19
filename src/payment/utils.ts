type ValidJSONArray = string[]

export function parseStringArrToJson<T>(arr: ValidJSONArray): T[] {
  const wrap = `[${arr.join(",")}]`
  return JSON.parse(wrap) as T[];
}


export function safeDollar(input: number, scaleFactor: bigint = 100n): number {
  const fixed = BigInt(Math.round(input * Number(scaleFactor)));
  return Number(fixed) / (100 * Number(scaleFactor));
}