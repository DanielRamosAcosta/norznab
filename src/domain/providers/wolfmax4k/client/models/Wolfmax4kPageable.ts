export interface Wolfmax4kPageableMeta {
  page: number;
  size: number;
  hasNext: boolean;
}

export interface Wolfmax4kPageable<T> {
  items: T[];
  meta: Wolfmax4kPageableMeta;
}
