type ValidJSONArray = string[]

export function parseStringArrToJson<T>(arr: ValidJSONArray): T[] {
  const wrap = `[${arr.join(",")}]`
  return JSON.parse(wrap) as T[];
}

export function toFixedPoint(value: number, scale: bigint = 100n): bigint {
  return BigInt(Math.round(value * Number(scale)));
}

export function fromFixedPoint(value: bigint, scale: bigint = 100n): number {
  return Number(value) / Number(scale);
}
