type ValidJSONArray = string[]

export function parseStringArrToJson<T>(arr: ValidJSONArray): T[] {
  const wrap = `[${arr.join(",")}]`
  return JSON.parse(wrap) as T[];
}
