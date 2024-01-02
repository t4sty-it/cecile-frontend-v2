export type Signed<T> = T & {id: string}
export type Box<T> = Signed<{ readonly value: T; }>;
export const boxOf = <T>(value: T, id?: string) => ({
  id: id ?? '' + Math.random(),
  value
});
export const unbox = <T>(box: Box<T>) => box.value;
